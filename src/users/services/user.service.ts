import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectKnex, Knex } from 'nestjs-knex';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PoktPoolUser } from '../../auth/entities/user.entity';
import { BalanceHistoryFilterDto } from 'src/stake/dto/balance-history-filter.dto';
import { Customer } from 'src/auth/entities/customer.entity';
import { SubmitTxDto } from '../dto/submit-tx.dto';
import { JsonRpcProvider } from '@pokt-foundation/pocketjs-provider';
import { V1RpcRoutes, validateTransactionResponse } from '@pokt-foundation/pocketjs-abstract-provider';
import { RawTransactionResponse, TransactionResponse } from '@pokt-foundation/pocketjs-types';
import { WALLET_VERF_STATUS } from 'src/wallet/wallet.constants';
import { HistoryQueryDto } from '../dto/history-query.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';
import { CONTACT_CHANNEL } from 'src/admin/enums/notification.enum';

@Injectable()
export class UsersService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getPortfolio(poktPoolUser: PoktPoolUser) {
    const [customers, { latest_exchange: pokt_price }] = await Promise.all([
      this.knex('customer')
        .select(['customer.*', 'vw_wallet_list.staked_amount'])
        .innerJoin('vw_wallet_list', 'vw_wallet_list.customer_id', 'customer.customer_id')
        .where({
          'customer.user_id': poktPoolUser.id,
          'customer.is_active': true,
        }),
      this.knex('vw_pp_latest_xerate').first('latest_exchange'),
    ]);

    const pendingWallets = await this.knex('wallet_verf_req')
      .select('verf_req_id')
      .where('user_id', poktPoolUser.id)
      .andWhere('req_status', WALLET_VERF_STATUS.PENDING);

    return {
      pendingWalletCount: pendingWallets.length,
      wallets: customers,
      pokt_price,
    };
  }

  async getPoktPoolUserInfo(poktPoolUser: PoktPoolUser) {
    const [customers, permissions, primaryCustomer] = await Promise.all([
      this.knex('customer').select('customer_id').where({
        user_id: poktPoolUser.id,
        is_active: true,
      }),
      this.knex('vw_user_permissions').select('feature_id').where({
        user_id: poktPoolUser.id,
        pool_id: 1,
      }),
      this.knex('vw_wallet_list').first('customer_id').where({
        user_id: poktPoolUser.id,
        wallet_rank: 1,
      }),
    ]);
    return {
      isEmailVerified: poktPoolUser.isEmailVerified,
      isTwoFactorEnabled: poktPoolUser.isTwoFactorEnabled,
      jumioDecision: poktPoolUser.jumioDecision,
      username: poktPoolUser.username,
      email: poktPoolUser.email,
      userIconUrl: poktPoolUser.userIconUrl,
      primaryCustomerId: primaryCustomer?.customer_id,
      customerIds: customers.map((customer) => customer.customer_id),
      permissions: permissions.map(({ feature_id }) => feature_id),
    };
  }

  async getUserData(customer: Customer) {
    const noData = {
      customer_id: customer.id,
      staked_amount: 0,
      gross_rewards: 0,
      net_rewards: 0,
      sweeps_distributed: 0,
      unstakes_distributed: 0,
      pending_unstakes: 0,
      pending_stakes: 0,
    };
    const data =
      (await this.knex.first('*').from('vw_wallet_list').where({
        customer_id: customer.id,
      })) || noData;
    const { latest_exchange: pokt_price } = await this.knex
      .first('latest_exchange')
      .from('vw_pp_latest_xerate');
    return {
      ...data,
      pokt_price,
      staked_value: Number(pokt_price) * Number(data.staked_amount),
      wallet_address: customer.primaryWalletId,
      wallet_nickname: customer.nickname,
    };
  }

  async getUserBalanceHistory(customer: Customer, filterDto: BalanceHistoryFilterDto) {
    const query = this.knex
      .select('*')
      .from('vw_pp_cust_balance_asof')
      .where({
        customer_id: customer.id,
      })
      .orderBy('as_of_date');

    if (filterDto.startDate) {
      query.where('as_of_date', '>=', filterDto.startDate);
    }
    if (filterDto.endDate) {
      query.where('as_of_date', '<=', filterDto.endDate);
    }
    return query;
  }

  async getUserRewardHistory(customer: Customer) {
    const data = await this.knex
      .select('*')
      .from('vw_pp_cust_balance_asof')
      .where({
        customer_id: customer.id,
      })
      .orderBy('as_of_date', 'desc');
    return data;
  }

  async getMonthlyStatement(customer: Customer) {
    const data = await this.knex
      .select('*')
      .from('monthly_stmt')
      .where({
        customer_id: customer.id,
      })
      .orderBy('as_of_date', 'desc');
    return data;
  }

  async downloadHistory(customer: Customer, historyQueryDto: HistoryQueryDto) {
    const query = this.knex
      .select('*')
      .from('vw_pp_cust_hist_download')
      .where({
        customer_id: customer.id,
      })
      .orderBy('txn_timestamp', 'desc');

    if (historyQueryDto.startDate) {
      query.where('txn_timestamp', '>=', historyQueryDto.startDate);
    }
    if (historyQueryDto.endDate) {
      query.where('txn_timestamp', '<=', historyQueryDto.endDate);
    }

    return query;
  }

  async submitTx(submitTxDto: SubmitTxDto) {
    try {
      const provider = new JsonRpcProvider({
        rpcUrl: this.configService.get('pocketCore'),
      });
      const perfromRes = await (provider as any).perform({
        route: V1RpcRoutes.ClientRawTx,
        body: submitTxDto,
        timeout: 10 * 1000,
      });
      const rawTxResponse = (await perfromRes.json()) as RawTransactionResponse;
      const txResponse: TransactionResponse = validateTransactionResponse(rawTxResponse);
      return { txHash: txResponse.txHash };
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Failed to send');
    }
  }

  async getNotificationSettings(poktPoolUser: PoktPoolUser) {
    return this.knex('contact_prefs')
      .select('contact_type.*')
      .where({
        user_id: poktPoolUser.id,
        channel_id: CONTACT_CHANNEL.EMAIL,
      })
      .innerJoin('contact_type', 'contact_type.contact_type_id', 'contact_prefs.contact_type_id');
  }

  async updateNotificationSettings(
    poktPoolUser: PoktPoolUser,
    updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ) {
    const contactPrefs = await this.knex('contact_prefs').select('*').where({
      user_id: poktPoolUser.id,
      channel_id: CONTACT_CHANNEL.EMAIL,
    });

    const contactTypes = await this.knex('contact_type').select('*');
    for (const { contact_type_id } of contactTypes) {
      if (updateNotificationSettingsDto.contact_type_ids.includes(contact_type_id)) {
        if (!contactPrefs.some((pref) => pref.contact_type_id === contact_type_id)) {
          await this.knex('contact_prefs').insert({
            user_id: poktPoolUser.id,
            channel_id: CONTACT_CHANNEL.EMAIL,
            contact_type_id,
          });
        }
      } else {
        // if currently opted-in, remove
        if (contactPrefs.some((pref) => pref.contact_type_id === contact_type_id)) {
          await this.knex('contact_prefs').delete().where({
            user_id: poktPoolUser.id,
            channel_id: CONTACT_CHANNEL.EMAIL,
            contact_type_id,
          });
          await this.knex('contact_unsubs').insert({
            user_id: poktPoolUser.id,
            channel_id: CONTACT_CHANNEL.EMAIL,
            contact_type_id,
          });
        }
      }
    }
  }
}
