import { Injectable } from '@nestjs/common';
import { pick } from 'lodash';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';
import { WALLET } from '../admin.types';
import { UpdateWalletsOrderDto } from '../dto/update-wallets-order.dto';
import { RPT_PARAM_KEY } from '../enums/admin.enum';
import { NETWORK_ID, TXN_STATUS } from 'src/constants';
import { EditAdminWalletDto } from '../dto/edit-wallet.dto';

@Injectable()
export class AdminWalletService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getAdminWallets() {
    const blockId = await this.pocketService.getBlockHeight();
    const walletsMap = {};
    const wallets: WALLET[] = await this.nodeKnex('wallet')
      .select('*')
      .where({ network_id: NETWORK_ID.POKT });

    await Promise.all(
      wallets.map(async (wallet) => {
        const balance = await this.pocketService.getWalletBalance({
          walletAddress: wallet.wallet_address,
          blockId,
        });
        Object.assign(wallet, {
          balance: balance.toFixed(0),
        });
        walletsMap[wallet.wallet_id] = true;
      }),
    );

    const rpt_param = await this.nodeKnex('rpt_params').first('*').where({
      param_key: RPT_PARAM_KEY.ADMIN_WALLETS_ORDER,
    });
    const dbOrder = rpt_param ? JSON.parse(rpt_param.param_value) : [];
    const order = [];
    for (const wallet_id of dbOrder) {
      if (walletsMap[wallet_id]) {
        walletsMap[wallet_id] = false;
        order.push(wallet_id);
      }
    }
    for (const wallet of wallets) {
      const wallet_id = wallet.wallet_id;
      if (walletsMap[wallet_id]) {
        walletsMap[wallet_id] = false;
        order.push(wallet_id);
      }
    }

    return { wallets, order, blockId };
  }

  private buildTxResponse(tx) {
    const { tx_result, stdTx } = tx;
    const from_wallet_address = tx_result.signer.toUpperCase();
    const to_wallet_address = tx_result.recipient ? tx_result.recipient.toUpperCase() : null;
    return {
      hash: tx.hash,
      block_height: tx.height,
      memo: stdTx.memo ? stdTx.memo : null,
      from_wallet_address,
      to_wallet_address,
      fee_amount: stdTx.fee.length ? stdTx.fee[0].amount : null,
      received: tx.received,
      result: tx_result.code === 0 ? TXN_STATUS.SUCCESS : TXN_STATUS.FAILED,
      amount: tx_result.message_type === 'send' ? stdTx.msg.value.amount : null,
    };
  }

  async getAdminWalletDetails(walletId: string) {
    const blockId = await this.pocketService.getBlockHeight();
    const wallet: WALLET = await this.nodeKnex('wallet')
      .first('*')
      .where({ network_id: 1, rpt_display: true, wallet_id: walletId });
    const balance = await this.pocketService.getWalletBalance({
      walletAddress: wallet.wallet_address,
      blockId,
    });
    Object.assign(wallet, {
      balance: balance.toFixed(0),
    });

    const data1 = await this.pocketService.getAccountTxs(wallet.wallet_address, true);
    const data2 = await this.pocketService.getAccountTxs(wallet.wallet_address, false);
    const txs = data1.txs.concat(data2.txs);
    const total_txs = data1.total_txs + data2.total_txs;
    txs.sort((a, b) => b.height - a.height);

    return { blockId, wallet, total_txs, txs: txs.map((tx) => this.buildTxResponse(tx)) };
  }

  async updateWalletsOrder(updateWalletsOrderDto: UpdateWalletsOrderDto) {
    const value = JSON.stringify(updateWalletsOrderDto.walletIds);
    await this.nodeKnex('rpt_params').delete().where({
      param_key: RPT_PARAM_KEY.ADMIN_WALLETS_ORDER,
    });
    await this.nodeKnex('rpt_params').insert({
      param_key: RPT_PARAM_KEY.ADMIN_WALLETS_ORDER,
      param_value: value,
    });
  }

  async editWallet(editWalletDto: EditAdminWalletDto) {
    for (const editWallet of editWalletDto.updates) {
      await this.nodeKnex('wallet')
        .update(pick(editWallet, ['wallet_name', 'is_active', 'rpt_display']))
        .where({ wallet_id: editWallet.wallet_id });
    }
  }
}
