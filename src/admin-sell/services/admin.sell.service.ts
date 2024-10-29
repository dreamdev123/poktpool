import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { RejectCommitDto } from '../dto/reject-commit.dto';
import { ProcessCommitDto } from '../dto/process-commit.dto';
import { SALE_COMMIT_STATUS, SALE_COMMIT_TXN } from 'src/types/sale_commit_txn';
import { WALLET, WALLET_TYPE_CODE } from 'src/types/wallet';
import { NETWORK_ID } from 'src/constants';
import { PocketService } from 'src/pocket/services/pocket.service';
import BigNumber from 'bignumber.js';
import { Repository } from 'typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CURRENCY_CODE } from 'src/types/currency_xref';

@Injectable()
export class AdminSellService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getCommits() {
    const data = await this.knex('sale_commit_txn')
      .select(['sale_commit_txn.*', 'username'])
      .innerJoin('customer', 'customer.customer_id', 'sale_commit_txn.customer_id')
      .innerJoin('pokt_pool_user', 'pokt_pool_user.user_id', 'customer.user_id');
    return data;
  }

  async rejectCommit(rejectCommitDto: RejectCommitDto) {
    const txn = await this.knex('sale_commit_txn')
      .first('*')
      .where({
        sale_commit_id: rejectCommitDto.sale_commit_id,
      })
      .whereIn('sale_commit_status', [SALE_COMMIT_STATUS.PENDING, SALE_COMMIT_STATUS.VERIFYING]);
    if (!txn) {
      throw new BadRequestException('Bad request');
    }

    const [result] = await this.knex('sale_commit_txn')
      .update({
        sale_commit_status: SALE_COMMIT_STATUS.REJECTED,
      })
      .where({
        sale_commit_id: rejectCommitDto.sale_commit_id,
      })
      .returning('*');
    return result;
  }

  async processCommit(processCommitDto: ProcessCommitDto) {
    const saleCommitTxn: SALE_COMMIT_TXN = await this.knex('sale_commit_txn').first('*').where({
      sale_commit_id: processCommitDto.sale_commit_id,
      sale_commit_status: SALE_COMMIT_STATUS.VERIFYING,
    });
    if (!saleCommitTxn) {
      throw new BadRequestException('Bad request');
    }

    const customer = await this.customerRepository.findOne({
      where: {
        id: saleCommitTxn.customer_id,
      },
    });
    if (!customer) {
      throw new InternalServerErrorException('Customer wallet not found');
    }

    const token_amount_processed = new BigNumber(
      new BigNumber(processCommitDto.amount).div(saleCommitTxn.token_price).multipliedBy(1e6).toFixed(0),
    );
    const tokens_to_stake = new BigNumber(
      token_amount_processed.multipliedBy(saleCommitTxn.stake_percent).toFixed(0),
    );
    const tokens_to_send = token_amount_processed.minus(tokens_to_stake);

    const pokt_sales_wallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      network_id: NETWORK_ID.POKT,
      wallet_type_code: WALLET_TYPE_CODE.POKT_SALES,
    });
    if (!pokt_sales_wallet) {
      throw new InternalServerErrorException('POKT sales wallet not found');
    }
    const blockId = await this.pocketService.getBlockHeight();
    const pokt_sales_balance = await this.pocketService.getWalletBalance({
      walletAddress: pokt_sales_wallet.wallet_address,
      blockId,
    });

    if (token_amount_processed.plus(1e6).isGreaterThan(pokt_sales_balance)) {
      throw new BadRequestException('Insufficient balance');
    }

    await this.knex('sale_commit_txn')
      .update({
        sale_commit_status: SALE_COMMIT_STATUS.ERROR,
      })
      .where({
        sale_commit_id: saleCommitTxn.sale_commit_id,
      });

    let distribution_txn_hash = null;
    if (tokens_to_send.isGreaterThan(0)) {
      const { txHash } = await this.pocketService.transferPOKT({
        fromWalletAddress: pokt_sales_wallet.wallet_address,
        toWalletAddress: customer.primaryWalletId,
        amount: tokens_to_send,
      });
      distribution_txn_hash = txHash;
    }

    let distribution_wallet_txn_id = null;
    if (tokens_to_stake.isGreaterThan(0)) {
      const { txHash } = await this.pocketService.transferPOKT({
        fromWalletAddress: pokt_sales_wallet.wallet_address,
        toWalletAddress: this.configService.get('stakeWallet'),
        amount: tokens_to_stake,
      });
      const [{ wallet_txn_id }] = await this.knex('wallet_txn')
        .insert({
          customer_id: customer.id,
          network_id: NETWORK_ID.POKT,
          network_txn_id: txHash,
          sender_wallet_id: pokt_sales_wallet.wallet_address,
          recipient_wallet_id: this.configService.get('stakeWallet'),
          currency_code: CURRENCY_CODE.UPOKT,
          txn_type_code: 24,
          bucket_code: 3,
          verification_code: 3,
          txn_timestamp: new Date().toISOString(),
        })
        .returning('*');
      distribution_wallet_txn_id = wallet_txn_id;
    }

    const [result] = await this.knex('sale_commit_txn')
      .update({
        sale_commit_status: SALE_COMMIT_STATUS.TRANSFERRING,
        payment_amount_recvd: processCommitDto.amount,
        token_amount_processed: token_amount_processed.div(1e6).toFixed(6),
        tokens_to_send: tokens_to_send.div(1e6).toFixed(6),
        tokens_to_stake: tokens_to_stake.div(1e6).toFixed(6),
        distribution_txn_hash,
        distribution_wallet_txn_id,
      })
      .where({
        sale_commit_id: saleCommitTxn.sale_commit_id,
      })
      .returning('*');
    return result;
  }
}
