import { Customer } from 'src/auth/entities/customer.entity';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { CreateStakeDto } from '../dto/create-stake.dto';
import { QueryCustomerDto } from '../dto/query-customer.dto';
import { TransferStakeDto } from '../dto/transfer-stake.dto';
import { OneTimeCodeService } from 'src/one-time-code/services/one-time-code.service';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { TXN_TYPE_CODE } from 'src/constants';
import { NotificationService } from 'src/pocket/services/notification.service';

@Injectable()
export class StakeService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    private oneTimeCodeService: OneTimeCodeService,
    private readonly notificationService: NotificationService,
  ) {}

  async getTransactions(customer: Customer) {
    const data = await this.knex('vw_pp_cust_stakes_hist').select('*').where({
      customer_id: customer.id,
    });
    return data;
  }

  async addNewStake(customer: Customer, createStakeDto: CreateStakeDto) {
    const [result] = await this.knex('zz_stake_driver')
      .insert({
        cust_id: customer.id,
        netwk_txnid: createStakeDto.txId,
        curr: 'UPOKT',
        stake_method: createStakeDto.stake_method,
      })
      .returning('*');
    if (result.status.includes('Failed')) {
      throw new BadRequestException(result.status);
    }
    return result;
  }

  async queryCustomer(queryCustomerDto: QueryCustomerDto) {
    const data = await this.knex('customer').first('customer_id').where({
      pool_id: 1,
      p_wallet_id: queryCustomerDto.walletId,
    });
    if (!data) {
      throw new NotFoundException('Not found');
    }
    return data;
  }

  async transferStake(poktPoolUser: PoktPoolUser, customer: Customer, transferStakeDto: TransferStakeDto) {
    await this.oneTimeCodeService.checkCode(poktPoolUser, TXN_TYPE_CODE.TRANSFER, {
      twoFactorCode: transferStakeDto.twoFactorCode,
      oneTimeCode: transferStakeDto.oneTimeCode,
    });

    const toCustomers = await this.knex('customer')
      .select('customer_id')
      .whereIn(
        'customer_id',
        transferStakeDto.list.map(({ to_customer_id }) => to_customer_id),
      );
    const toCustomerIds = toCustomers.map(({ customer_id }) => customer_id);
    if (transferStakeDto.list.find(({ to_customer_id }) => !toCustomerIds.includes(to_customer_id))) {
      throw new BadRequestException('Invalid customer id');
    }

    try {
      await this.knex.raw('SELECT transfer_stake(?)', [
        JSON.stringify({
          from_customer_id: customer.id,
          ...transferStakeDto,
        }),
      ]);
      this.notificationService.sendTransferReceivedEmail(customer, transferStakeDto).catch(console.log);
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.hint);
    }
  }

  async getTransfers(customer: Customer) {
    const data = await this.knex('vw_pp_cust_transfer_hist')
      .select('*')
      .where({
        from_customer_id: customer.id,
      })
      .orderBy('transfer_timestamp', 'desc');
    return data;
  }
}
