import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { CommitBuyDto } from '../dto/commit-buy.dto';
import { SubmitPaymentDto } from '../dto/submit-payment.dto';
import { NETWORK_ID } from 'src/constants';
import { SALE_COMMIT_STATUS } from 'src/types/sale_commit_txn';
import { WALLET, WALLET_TYPE_CODE } from 'src/types/wallet';
import { XE_RATE_HIST } from 'src/types/xe_rate_hist';
import { Customer } from 'src/auth/entities/customer.entity';

@Injectable()
export class BuyService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getPoktPrice() {
    const [data] = await this.knex('xe_rate_hist')
      .select('*')
      .where({
        from_currency_code: 2,
        to_currency_code: 3,
      })
      .orderBy('xe_timestamp', 'desc')
      .limit(1);
    return {
      xe_rate: data.xe_rate,
      xe_rate_id: data.xe_rate_id,
    };
  }

  async getRandomUSDCAddress() {
    const wallets: WALLET[] = await this.nodeKnex('wallet').select('*').where({
      network_id: NETWORK_ID.ETH,
      wallet_type_code: WALLET_TYPE_CODE.USDC_RECEIVE,
    });
    if (wallets.length === 0) {
      throw new InternalServerErrorException('No USDC wallets');
    }

    const index = Math.floor(Math.random() * wallets.length);
    return wallets[index].wallet_address;
  }

  async commit(customer: Customer, commitBuyDto: CommitBuyDto) {
    const xe_rate: XE_RATE_HIST = await this.knex('xe_rate_hist').first('*').where({
      xe_rate_id: commitBuyDto.xe_rate_id,
      from_currency_code: 2,
      to_currency_code: 3,
    });
    if (!xe_rate) {
      throw new BadRequestException('Bad request');
    }
    if (xe_rate.xe_eff_end_ts && Date.now() - new Date(xe_rate.xe_eff_end_ts).getTime() > 60 * 1000) {
      throw new BadRequestException('Price expired');
    }

    const recpt_wallet_address = await this.getRandomUSDCAddress();
    const request = {
      customer_id: customer.id,
      token_currency_code: 2,
      token_amount: commitBuyDto.token_amount,
      token_price: xe_rate.xe_rate,
      commit_total: commitBuyDto.token_amount * Number(xe_rate.xe_rate),
      send_percent: 1 - commitBuyDto.stake_percent,
      stake_percent: commitBuyDto.stake_percent,
      discord_handle: commitBuyDto.discord_handle,
      telegram_handle: commitBuyDto.telegram_handle,
      txn_timestamp: new Date().toISOString(),
      commit_exp_timestamp: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      txn_type_code: 25,
      sale_commit_status: SALE_COMMIT_STATUS.PENDING,
      recpt_wallet_address,
    };
    const [result] = await this.knex('sale_commit_txn').insert(request).returning('*');

    return result;
  }

  async getCommitHistory(customer: Customer) {
    const data = await this.knex('sale_commit_txn').select('*').where({
      customer_id: customer.id,
    });
    return data;
  }

  async submitPayment(customer: Customer, submitPaymentDto: SubmitPaymentDto) {
    const txn = await this.knex('sale_commit_txn').first('*').where({
      customer_id: customer.id,
      sale_commit_id: submitPaymentDto.sale_commit_id,
      sale_commit_status: SALE_COMMIT_STATUS.PENDING,
    });
    if (!txn) {
      throw new BadRequestException('Bad request');
    }

    const [result] = await this.knex('sale_commit_txn')
      .update({
        payment_network_id: NETWORK_ID.ETH,
        payment_currency_code: submitPaymentDto.payment_currency_code,
        payment_txn_hash: submitPaymentDto.payment_txn_hash,
        payment_txn_timestamp: new Date().toISOString(),
        sale_commit_status: SALE_COMMIT_STATUS.VERIFYING,
      })
      .where({
        customer_id: customer.id,
        sale_commit_id: submitPaymentDto.sale_commit_id,
        sale_commit_status: SALE_COMMIT_STATUS.PENDING,
      })
      .returning('*');
    return result;
  }
}
