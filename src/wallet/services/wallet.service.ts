import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { AddWalletDto } from '../dto/add-wallet.dto';
import getUPOKT from 'src/utils/getUPOKT';
import { WALLET_VERF_STATUS } from '../wallet.constants';
import { CheckWalletDto } from '../dto/check-wallet.dto';
import { RetryWalletDto } from '../dto/retry-wallet.dto';
import { STAGE } from 'src/constants';
import { EditWalletDto } from '../dto/edit-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async countWallets(poktPoolUser: PoktPoolUser) {
    const customers = await this.knex('customer')
      .select('customer_id')
      .where({ user_id: poktPoolUser.id, is_active: true });

    const wallets = await this.knex('wallet_verf_req')
      .select('verf_req_id')
      .where('user_id', poktPoolUser.id)
      .andWhere('req_status', WALLET_VERF_STATUS.PENDING);

    return customers.length + wallets.length;
  }

  randomVerfAmount() {
    const poktAmount = Math.ceil((1 - Math.random()) * 50) / 100;
    return getUPOKT(poktAmount);
  }

  async addNewWallet(poktPoolUser: PoktPoolUser, addWalletDto: AddWalletDto) {
    await this.checkWallet({
      walletAddress: addWalletDto.walletAddress,
    });

    const count = await this.countWallets(poktPoolUser);
    const maxLimit = this.configService.get('STAGE') === STAGE.PROD ? 3 : 15;
    if (count >= maxLimit) {
      throw new BadRequestException("You've reached at the maximum number of wallets to be added.");
    }

    const [result] = await this.knex('wallet_verf_req')
      .insert({
        user_id: poktPoolUser.id,
        wallet_address: addWalletDto.walletAddress,
        wallet_nickname: addWalletDto.nickname,
        network_id: 1,
        pool_id: 1,
        req_timestamp: new Date().toISOString(),
        exp_timestamp: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        verf_amount: this.randomVerfAmount(),
      })
      .returning('*');
    return result;
  }

  async editWallet(poktPoolUser: PoktPoolUser, customerId: string, editWalletDto: EditWalletDto) {
    const [customer] = await this.knex('customer')
      .update({
        wallet_nickname: editWalletDto.nickname,
      })
      .where({
        customer_id: customerId,
        user_id: poktPoolUser.id,
        is_active: true,
      })
      .returning('*');
    return customer;
  }

  async checkWallet(checkWalletDto: CheckWalletDto) {
    const existingCustomer = await this.customerRepository.findOne({
      where: {
        primaryWalletId: checkWalletDto.walletAddress,
        isActive: true,
      },
    });
    if (existingCustomer) {
      throw new BadRequestException('Wallet is already being used by other user');
    }

    const existingWallet = await this.knex('wallet_verf_req')
      .first('*')
      .where('wallet_address', checkWalletDto.walletAddress)
      .whereNot('req_status', WALLET_VERF_STATUS.EXPIRED);
    if (existingWallet) {
      throw new BadRequestException('Wallet is already being used by other user');
    }
  }

  async listWallets(poktPoolUser: PoktPoolUser) {
    const customers = await this.knex('customer')
      .select(['customer.*', 'vw_pp_cust_aggs.staked_amount', 'vw_pp_cust_aggs.pending_stakes'])
      .innerJoin('vw_pp_cust_aggs', 'vw_pp_cust_aggs.customer_id', 'customer.customer_id')
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

  async retryWallet(poktPoolUser: PoktPoolUser, retryWalletDto: RetryWalletDto) {
    const [result] = await this.knex('wallet_verf_req')
      .update({
        req_timestamp: new Date().toISOString(),
        exp_timestamp: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        verf_amount: this.randomVerfAmount(),
        req_status: WALLET_VERF_STATUS.PENDING,
        last_check_timestamp: null,
        verf_txn_hash: null,
      })
      .where({
        user_id: poktPoolUser.id,
        verf_req_id: retryWalletDto.verf_req_id,
        req_status: WALLET_VERF_STATUS.EXPIRED,
      })
      .returning('*');

    if (!result) {
      throw new BadRequestException('Invalid request');
    }
    return result;
  }
}
