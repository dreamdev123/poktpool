import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { AddDistributionTypeDto } from '../dto/add-distribution-type.dto';
import { SendBonusDto } from '../dto/send-bonus.dto';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';

@Injectable()
export class AdminBonusService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getCategories() {
    const pools = await this.knex('pool')
      .select(['pool_id', 'pool_name', 'staked_amount'])
      .leftJoin('vw_wallet_list', 'vw_wallet_list.customer_id', 'pool.ppinc_customer_id');
    const categories = await this.knex('txn_type_xref').select('*').whereNotNull('txn_type_category');
    return { pools, categories };
  }

  async addDistributionType(addDistributionTypeDto: AddDistributionTypeDto) {
    const [result] = await this.knex('txn_type_xref')
      .insert({
        txn_type_desc: addDistributionTypeDto.txn_type_desc,
        txn_type_category: addDistributionTypeDto.txn_type_category,
      })
      .returning('*');
    return result;
  }

  async sendBonus(sendBonusDto: SendBonusDto) {
    const walletAddresses = sendBonusDto.wallets.map((address) => address.toUpperCase().trim());
    const targets = await this.knex('customer').select('*').whereIn('p_wallet_id', walletAddresses).andWhere({
      pool_id: sendBonusDto.pool_id,
      is_active: true,
    });

    const filtered = walletAddresses.filter(
      (address) => !targets.some(({ p_wallet_id }) => p_wallet_id === address),
    );
    if (filtered.length !== 0) {
      throw new BadRequestException(filtered, 'Wallets not found');
    }

    const { ppinc_customer_id, staked_amount } = await this.knex('pool')
      .first(['ppinc_customer_id', 'staked_amount'])
      .where('pool_id', sendBonusDto.pool_id)
      .leftJoin('vw_wallet_list', 'vw_wallet_list.customer_id', 'pool.ppinc_customer_id');
    if (Number(staked_amount) < sendBonusDto.amount * targets.length) {
      throw new BadRequestException('Not enough funds');
    }

    await this.knex.raw('SELECT transfer_stake(?)', [
      JSON.stringify({
        from_customer_id: ppinc_customer_id,
        balance_type: 'Staked',
        txn_type_code: sendBonusDto.txn_type_code,
        list: targets.map(({ customer_id }) => ({
          to_customer_id: customer_id,
          amount: sendBonusDto.amount,
          memo: sendBonusDto.memo,
        })),
      }),
    ]);
  }

  async getTransactions(queryTransactionsDto: QueryTransactionsDto) {
    return this.knex('transfer_req_hist')
      .select([
        'transfer_req_hist.*',
        'txn_type_xref.txn_type_desc',
        'txn_type_xref.txn_type_category',
        'customer.p_wallet_id',
        'pool.pool_name',
      ])
      .innerJoin('txn_type_xref', 'txn_type_xref.txn_type_code', 'transfer_req_hist.txn_type_code')
      .innerJoin('customer', 'customer.customer_id', 'transfer_req_hist.to_customer_id')
      .innerJoin('pool', 'pool.pool_id', 'customer.pool_id')
      .where({ 'transfer_req_hist.txn_type_code': queryTransactionsDto.txn_type_code })
      .orderBy('transfer_txn_id', 'desc');
  }
}
