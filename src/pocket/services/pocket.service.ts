import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import BigNumber from 'bignumber.js';
import { SecretsManager } from 'aws-sdk';
import { Client as DiscordClient } from 'discord.js';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { TextChannel } from 'discord.js';
import { JsonRpcProvider } from '@pokt-foundation/pocketjs-provider';
import { KeyManager } from '@pokt-foundation/pocketjs-signer';
import { TransactionBuilder } from '@pokt-foundation/pocketjs-transaction-builder';
import { V1RpcRoutes, validateTransactionResponse } from '@pokt-foundation/pocketjs-abstract-provider';
import { RawTransactionResponse, TransactionResponse } from '@pokt-foundation/pocketjs-types';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { TXN_STATUS } from 'src/constants';
import { AxiosError } from 'axios';

@Injectable()
export class PocketService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
  ) {}

  alertsChannel: TextChannel = null;

  @Once('ready')
  onReady() {
    this.alertsChannel = this.discordClient.channels.cache.get(
      this.configService.get('alertsChannel'),
    ) as TextChannel;
  }

  private async sendPoktApiFailureNotification(path: string, payload: any, err: Error) {
    try {
      const message = typeof err.message === 'string' ? err.message : 'Unknown error';
      const axiosErr = err as AxiosError;
      const responseMsg = JSON.stringify(axiosErr?.response?.data, null, 2);
      await this.alertsChannel.send(
        [
          `POKT_API_FAILURE`,
          '```',
          message,
          '```',
          'Path',
          '```',
          path,
          '```',
          'Payload',
          '```',
          JSON.stringify(payload, null, 2),
          '```',
          'Response',
          '```',
          responseMsg,
          '```',
        ].join('\n'),
      );
    } catch (err) {
      console.log(err);
    }
  }

  private async queryPoktAPI(path: string, payload: any, doRetry = true) {
    const retries = 3;
    for (let index = 0; index < retries; index += 1) {
      try {
        return await lastValueFrom(
          this.httpService.post(this.configService.get('pocketCore') + path, payload),
        );
      } catch (err) {
        if (!doRetry) {
          throw err;
        }
        console.log('Failed to query pokt API, retrying', err);
        if (index === retries - 1) {
          await this.sendPoktApiFailureNotification(path, payload, err);
          throw err;
        }
      }
    }
  }

  async getAccountTxs(
    walletAddress: string,
    received: boolean,
  ): Promise<{
    txs: any[];
    total_txs: number;
  }> {
    const {
      data: { txs, total_txs },
    } = await this.queryPoktAPI('/v1/query/accounttxs', {
      address: walletAddress,
      page: 0,
      per_page: 1000,
      received,
      prove: false,
      order: 'asc',
    });
    for (const tx of txs) {
      tx.received = received;
    }
    return { txs, total_txs };
  }

  async getTxStatus(txHash: string): Promise<TXN_STATUS> {
    try {
      const {
        data: { tx_result },
      } = await this.queryPoktAPI(
        '/v1/query/tx',
        {
          hash: txHash,
          prove: false,
        },
        false,
      );
      return tx_result.code === 0 ? TXN_STATUS.SUCCESS : TXN_STATUS.FAILED;
    } catch (err) {
      return TXN_STATUS.PENDING;
    }
  }

  async getTxData(txHash: string) {
    try {
      const { data } = await this.queryPoktAPI(
        '/v1/query/tx',
        {
          hash: txHash,
          prove: false,
        },
        false,
      );
      return data;
    } catch (err) {
      return null;
    }
  }

  async getLastInboundTxTime(walletAddress: string, blockId: number) {
    const tx = await this.nodeKnex('network_txn')
      .first('*')
      .where({
        network_id: 1,
        to_wallet_address: walletAddress.toUpperCase(),
        txn_currency_code: 1,
        network_txn_type: 'send',
      })
      .where('block_id', '<=', blockId)
      .orderBy('block_id', 'desc')
      .limit(1);
    return tx?.txn_timestamp;
  }

  async getDBBlockHeight(): Promise<number> {
    const { block_id } = await this.nodeKnex('network_block_hwm').first('*');
    return block_id;
  }

  async getBlockHeight(): Promise<number> {
    const { data } = await this.queryPoktAPI('/v1/query/height', {});
    if (!data.height) {
      throw new Error('Failed to get the current block height');
    }
    return data.height;
  }

  async getWalletBalance({ walletAddress, blockId }): Promise<BigNumber> {
    const { data: queryBalance } = await this.queryPoktAPI('/v1/query/balance', {
      height: blockId,
      address: walletAddress,
    });
    return new BigNumber(queryBalance.balance || 0);
  }

  async getBlockTime(block_id) {
    const {
      data: {
        block: { header: blockHeader },
      },
    } = await this.queryPoktAPI('/v1/query/block', {
      height: block_id,
    });
    return blockHeader.time;
  }

  private async getWalletPrivateKey(walletAddress) {
    const keyName = walletAddress.toLowerCase();
    const secretsManager = new SecretsManager({
      region: 'us-west-2',
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    });

    const { SecretString } = await secretsManager
      .getSecretValue({
        SecretId: keyName,
      })
      .promise();
    const value = JSON.parse(SecretString)[keyName];
    return value;
  }

  async transferPOKT({
    fromWalletAddress,
    toWalletAddress,
    amount,
    memo,
    considerFee,
  }: {
    fromWalletAddress: string;
    toWalletAddress: string;
    amount: BigNumber;
    memo?: string;
    considerFee?: boolean;
  }): Promise<{ txHash: string; amount: BigNumber }> {
    const finalAmount = considerFee ? amount.minus(500000) : amount;
    if (finalAmount.isLessThanOrEqualTo(0)) {
      return { txHash: null, amount: new BigNumber(0) };
    }

    const provider = new JsonRpcProvider({
      rpcUrl: this.configService.get('pocketCore'),
    });
    const privateKey = await this.getWalletPrivateKey(fromWalletAddress);
    const signer = await KeyManager.fromPrivateKey(privateKey);
    const transactionBuilder = new TransactionBuilder({
      provider,
      signer,
      chainID: 'mainnet',
    });
    const sendMsg = transactionBuilder.send({
      toAddress: toWalletAddress.toLowerCase(),
      amount: finalAmount.toFixed(0),
    });
    const rawTx = await transactionBuilder.createTransaction({
      memo,
      txMsg: sendMsg,
    });
    const perfromRes = await (provider as any).perform({
      route: V1RpcRoutes.ClientRawTx,
      body: { ...rawTx.toJSON() },
      timeout: 10 * 1000,
    });
    const rawTxResponse = (await perfromRes.json()) as RawTransactionResponse;
    const txResponse: TransactionResponse = validateTransactionResponse(rawTxResponse);
    return { txHash: txResponse.txHash, amount: finalAmount };
  }
}
