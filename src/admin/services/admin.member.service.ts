import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { MemberLookupDto } from '../dto/member-lookup.dto';
import { GetMemberDetailsDto } from '../dto/get-member-details.dto';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MemberCustomerQueryDto } from '../dto/member-customer-query.dto';
import { WALLET_VERF_STATUS } from 'src/wallet/wallet.constants';
import { TwoFactorBackupCode } from 'src/auth/entities/two-factor-backup-code.entity';
import { JUMIO_DECISION } from 'src/constants';

@Injectable()
export class AdminMemberService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    private dataSource: DataSource,
  ) {}

  async getMemberLookup(memberLookupDto: MemberLookupDto) {
    const { email, username, wallet, discord } = memberLookupDto;
    if (!email && !username && !wallet && !discord) {
      throw new BadRequestException('No search key');
    }

    let lookupQuery = this.knex('vw_pp_member_lookup').select('*').limit(11);

    if (email) {
      lookupQuery = lookupQuery.whereILike('email', `%${email}%`);
    }
    if (username) {
      lookupQuery = lookupQuery.whereILike('username', `%${username}%`);
    }
    if (wallet) {
      lookupQuery = lookupQuery.whereILike('p_wallet_id', `%${wallet}%`);
    }
    if (discord) {
      lookupQuery = lookupQuery.whereILike('discord_handle', `%${discord}%`);
    }

    return await lookupQuery;
  }

  async getMemberDetails(getMemberDetailsDto: GetMemberDetailsDto) {
    const user = await this.knex('vw_pp_member_lookup').first('*').where({
      email: getMemberDetailsDto.email,
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const customers = await this.customerRepository.find({
      where: {
        userId: user.user_id,
        isActive: true,
      },
    });
    return {
      ...user,
      wallets: customers,
    };
  }

  async getMemberStakes(customerQueryDto: MemberCustomerQueryDto) {
    const data = await this.knex('vw_pp_cust_stakes_hist').select('*').where({
      customer_id: customerQueryDto.customerId,
    });
    return data;
  }

  async getMemberSweeps(customerQueryDto: MemberCustomerQueryDto) {
    const data = await this.knex('vw_pp_cust_sweeps_hist').select('*').where({
      customer_id: customerQueryDto.customerId,
    });
    return data;
  }

  async getMemberUnstakes(customerQueryDto: MemberCustomerQueryDto) {
    const data = await this.knex('vw_pp_cust_unstake_hist').select('*').where({
      customer_id: customerQueryDto.customerId,
    });
    return data;
  }

  async getMemberTransfers(customerQueryDto: MemberCustomerQueryDto) {
    const data = await this.knex('vw_pp_cust_transfer_hist')
      .select('*')
      .where({
        from_customer_id: customerQueryDto.customerId,
      })
      .orderBy('transfer_timestamp', 'desc');
    return data;
  }

  async getMemberWallets(getMemberDetailsDto: GetMemberDetailsDto) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: getMemberDetailsDto.email,
      },
    });

    const customers = await this.knex('customer')
      .select(['customer.*', 'vw_wallet_list.staked_amount'])
      .innerJoin('vw_wallet_list', 'vw_wallet_list.customer_id', 'customer.customer_id')
      .where({
        'customer.user_id': poktPoolUser.id,
        'customer.is_active': true,
      });

    const wallets = await this.knex('wallet_verf_req')
      .select('*')
      .where('user_id', poktPoolUser.id)
      .whereNot('req_status', WALLET_VERF_STATUS.VERIFIED);

    return {
      active: customers,
      pending: wallets,
    };
  }

  async reset2FA(getMemberDetailsDto: GetMemberDetailsDto) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: getMemberDetailsDto.email,
      },
    });
    if (!poktPoolUser) {
      throw new BadRequestException('User not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TwoFactorBackupCode, {
        userId: poktPoolUser.id,
      });
      await manager.update(PoktPoolUser, { id: poktPoolUser.id }, { isTwoFactorEnabled: false });
    });
  }

  async resetKYC(getMemberDetailsDto: GetMemberDetailsDto) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: getMemberDetailsDto.email,
      },
    });
    if (!poktPoolUser) {
      throw new BadRequestException('User not found');
    }

    poktPoolUser.jumioAllowRetry = true;
    await this.poktPoolUsersRepository.save(poktPoolUser);
  }

  async approveKYC(getMemberDetailsDto: GetMemberDetailsDto) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: getMemberDetailsDto.email,
      },
    });
    if (!poktPoolUser) {
      throw new BadRequestException('User not found');
    }

    poktPoolUser.jumioDecision = JUMIO_DECISION.PASSED;
    poktPoolUser.jumioAllowRetry = false;
    poktPoolUser.jumioReason = null;
    await this.poktPoolUsersRepository.save(poktPoolUser);
  }
}
