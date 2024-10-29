import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { UnstakeConfirmDto } from 'src/users/dto/user-unstake.dto';
import { CancelUnstakeDto } from '../dto/cancel-unstake-percent.dto';
import { UpdateSweepPercentDto } from '../dto/update-sweep-percent.dto';
import { OneTimeCodeService } from 'src/one-time-code/services/one-time-code.service';
import { TXN_TYPE_CODE } from 'src/constants';
import { PoktPoolUser } from 'src/auth/entities/user.entity';

@Injectable()
export class WithdrawService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private oneTimeCodeService: OneTimeCodeService,
  ) {}

  async getSweepPercent(customer: Customer) {
    return {
      sweepPercent: customer.sweepPercent,
    };
  }

  async updateSweepPercent(customer: Customer, updateSweepPercentDto: UpdateSweepPercentDto) {
    customer.sweepPercent = updateSweepPercentDto.sweepPercent;
    await this.customerRepository.save(customer);

    return { sweepPercent: customer.sweepPercent };
  }

  async getSweeps(customer: Customer) {
    const data = await this.knex('vw_pp_cust_sweeps_hist').select('*').where({
      customer_id: customer.id,
    });
    return data;
  }

  async userUnstakeRequest(
    poktPoolUser: PoktPoolUser,
    customer: Customer,
    unstakeConfirmDto: UnstakeConfirmDto,
  ) {
    if (customer.primaryWalletId !== unstakeConfirmDto.primaryWalletId) {
      throw new BadRequestException('Please use your wallet address');
    }

    await this.oneTimeCodeService.checkCode(poktPoolUser, TXN_TYPE_CODE.UNSTAKE, {
      twoFactorCode: unstakeConfirmDto.twoFactorCode,
      oneTimeCode: unstakeConfirmDto.oneTimeCode,
    });

    const body: any = {
      customer_id: customer.id,
      currency_code: 1,
    };
    if (unstakeConfirmDto.unstakingAmount > 0) {
      if (unstakeConfirmDto.unstakingAmount <= 0.01) {
        throw new BadRequestException('Amount should be more than 0.01 POKT');
      }
      const data = await this.knex('vw_wallet_list').first('staked_amount').where({
        customer_id: customer.id,
      });
      if (unstakeConfirmDto.unstakingAmount > Number(data?.staked_amount || 0)) {
        throw new BadRequestException('Amount should be less than the staked balance');
      }

      body.amt_unstake = (unstakeConfirmDto.unstakingAmount * 1e6).toFixed(0);
    } else if (unstakeConfirmDto.unstakingPercent > 0) {
      body.perc_unstake = unstakeConfirmDto.unstakingPercent / 100;
    } else {
      throw new BadRequestException('Bad request');
    }

    try {
      const [newEntry] = await this.knex('unstake_req_hist').insert(body).returning('*');
      const data = await this.knex('vw_pp_cust_unstake_hist').first('*').where({
        unstake_req_id: newEntry.unstake_req_id,
      });
      return data;
    } catch (err) {
      throw new BadRequestException(err.hint);
    }
  }

  async getUnstakes(customer: Customer) {
    const data = await this.knex('vw_pp_cust_unstake_hist').select('*').where({
      customer_id: customer.id,
    });
    return data;
  }

  async cancelUnstake(customer: Customer, cancelUnstake: CancelUnstakeDto) {
    const unstakeEntry = await this.knex.first('*').from('unstake_req_hist').where({
      unstake_req_id: cancelUnstake.unstake_req_id,
      customer_id: customer.id,
    });
    if (!unstakeEntry) {
      throw new NotFoundException('Unstake request not found');
    }
    if (unstakeEntry.unstake_cancelled) {
      throw new BadRequestException('Already canceled');
    }
    if (unstakeEntry.unstake_complete) {
      throw new BadRequestException('Already distributed');
    }

    await this.knex('unstake_req_hist')
      .update({
        unstake_cancelled: true,
      })
      .where({
        unstake_req_id: cancelUnstake.unstake_req_id,
      });

    const data = await this.knex('vw_pp_cust_unstake_hist').first('*').where({
      unstake_req_id: cancelUnstake.unstake_req_id,
    });
    return data;
  }
}
