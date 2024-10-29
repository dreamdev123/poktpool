import { InjectRepository } from '@nestjs/typeorm';
import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { CloseTrancheDto } from '../dto/close-tranche.dto';
import { DISTRIBUTE_CHAIN_TXN_TYPE_CODES, FEATURE } from '../enums/admin.enum';
import { Customer } from 'src/auth/entities/customer.entity';
import { Repository } from 'typeorm';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';
import { CompleteTrancheDto } from '../dto/complete-tranche.dto';
import { WALLET } from '../admin.types';

@Injectable()
export class AdminService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private readonly pocketService: PocketService,
  ) {}

  async checkPermissions(features: FEATURE[], poktPoolUser: PoktPoolUser, poolId = 1) {
    const permissions = await this.knex('vw_user_permissions').select('feature_id').where({
      user_id: poktPoolUser.id,
      pool_id: poolId,
    });
    const userFeatures = permissions.map(({ feature_id }) => feature_id);
    if (features.some((feature) => userFeatures.includes(feature))) {
      return true;
    }
    throw new ForbiddenException('No permission');
  }

  async getPoolMemberStats() {
    const data = await this.knex.select('*').from('vw_pool_member_stats');
    return data;
  }

  async getStakePositionReport() {
    const [{ total_staked_member }]: any = await this.knex('vw_wallet_list').select(
      this.knex.raw('sum(staked_amount) as total_staked_member'),
    );
    const [{ total_staked_node, total_unstaking_node }]: any = await this.nodeKnex('vw_vendor_stakes')
      .select(
        this.knex.raw('sum(staked_pokt) as total_staked_node'),
        this.knex.raw('sum(unstaking_pokt) as total_unstaking_node'),
      )
      .where({
        pool_id: 1,
      });
    const [{ total_pending_unstakes }]: any = await this.knex('vw_pp_pending_unstakes')
      .select(this.knex.raw('sum(amount_owed) as total_pending_unstakes'))
      .whereNotNull('unstake_due_date');

    const { liquid_wallet_id } = await this.nodeKnex('pool').first('liquid_wallet_id').where({
      pool_id: 1,
    });
    if (!liquid_wallet_id) {
      throw new InternalServerErrorException('Missing liquid wallet');
    }
    const liquid_wallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      wallet_id: liquid_wallet_id,
    });
    if (!liquid_wallet) {
      throw new InternalServerErrorException('Missing liquid wallet');
    }
    const liquid_wallet_balance = await this.pocketService.getWalletBalance({
      walletAddress: liquid_wallet.wallet_address,
      blockId: await this.pocketService.getBlockHeight(),
    });
    return {
      total_staked_member,
      total_staked_node,
      total_unstaking_node,
      total_pending_unstakes,
      liquid_wallet_balance: liquid_wallet_balance.dividedBy(1e6).toFixed(0),
    };
  }

  async getUpcomingUnstakes() {
    const data = await this.knex.select('*').from('vw_pp_upcoming_unstakes');
    return data;
  }

  async getUpcomingStakes() {
    const data = await this.knex.select('*').from('vw_pp_pending_stakes');
    return data;
  }

  async getIndividualUnstakes() {
    const data = await this.knex.select('*').from('vw_pp_pending_unstakes');
    return data;
  }

  private async getCurrentOpenTrancheId() {
    const poolId = 1;
    const closedTranches = await this.knex.select('tranche_id').from('tranche').where({
      tranche_status: 'Closed',
      pool_id: poolId,
      is_finalized: false,
    });
    if (closedTranches.length > 1) {
      throw new InternalServerErrorException('Database error');
    }
    if (closedTranches.length === 1) {
      return closedTranches[0].tranche_id;
    }

    const openTranches = await this.knex.select('*').from('tranche').where({
      tranche_status: 'Open',
      pool_id: poolId,
    });
    if (openTranches.length !== 1) {
      throw new InternalServerErrorException('Database error');
    }
    return openTranches[0].tranche_id;
  }

  async getCurrentOpenTranche() {
    const poolId = 1;
    const tranche_id = await this.getCurrentOpenTrancheId();

    const data = await this.knex.select('*').from('tranche').where({
      tranche_id,
    });
    if (data.length !== 1) {
      throw new InternalServerErrorException('Database error');
    }

    const pool = await this.knex.first('*').from('pool').where({ pool_id: poolId });
    if (!pool) {
      throw new InternalServerErrorException('Database error');
    }

    const [{ total_staked_amount }]: any = await this.knex('vw_wallet_list').select(
      this.knex.raw('sum(staked_amount) as total_staked_amount'),
    );

    const { pokt_amount: total_pending_stakes } = await this.knex
      .first('pokt_amount')
      .from('vw_pp_total_pending_stakes');
    return {
      ...data[0],
      total_staked_amount,
      number_of_bins: Math.floor(total_staked_amount / (pool.infra_bin_size / 1e6)),
      total_pending_stakes,
    };
  }

  async getClosedTranches() {
    const data = await this.knex.select('*').from('vw_pp_tranche_stats').orderBy('tranche_id', 'desc');
    return data;
  }

  async getTrancheStatsById(trancheId) {
    const data = await this.knex.first('*').from('vw_pp_tranche_stats').where({ tranche_id: trancheId });
    const existingTxs = await this.nodeKnex('tranche_txn')
      .select('*')
      .where({
        pool_id: 1,
        tranche_id: trancheId,
      })
      .whereIn('chain_txn_type_code', DISTRIBUTE_CHAIN_TXN_TYPE_CODES);

    return { ...data, enableTransferButton: existingTxs.length === 0 };
  }

  async getTrancheTxsById(trancheId) {
    // transactions
    const transactions = await this.nodeKnex('tranche_txn')
      .select(
        '*',
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('from_wallet_id') })
          .as('from_wallet'),
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('to_wallet_id') })
          .as('to_wallet'),
      )
      .where({ tranche_id: trancheId })
      .whereIn('chain_txn_type_code', DISTRIBUTE_CHAIN_TXN_TYPE_CODES);

    await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.network_txn_hash) {
          transaction.network_txn_status = await this.pocketService.getTxStatus(transaction.network_txn_hash);
        }
      }),
    );

    return {
      transactions,
    };
  }

  async getTrancheById(trancheId) {
    const poolId = 1;
    const closedTranches = await this.knex.select('tranche_id').from('tranche').where({
      tranche_status: 'Closed',
      pool_id: poolId,
      is_finalized: false,
    });
    const data = await this.knex.first('*').from('tranche').where({ tranche_id: trancheId });

    return {
      ...data,
      eligible_to_close: data.tranche_status === 'Open' && closedTranches.length === 0,
    };
  }

  async closeTranche(closeTrancheDto: CloseTrancheDto) {
    try {
      const [{ count: activenodes }] = await this.nodeKnex('node').count('*').where({ is_staked: true });
      await this.knex.raw('CALL close_tranche(?)', [
        JSON.stringify({
          ...closeTrancheDto,
          activenodes: Number(activenodes),
        }),
      ]);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.hint);
    }
  }

  async estimateTranche(closeTrancheDto: CloseTrancheDto) {
    try {
      const {
        rows: [data],
      } = await this.knex.raw('select * from estimate_tranche(?)', [JSON.stringify(closeTrancheDto)]);
      return data;
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.hint);
    }
  }

  async completeTranche(completeTrancheDto: CompleteTrancheDto) {
    await this.knex('tranche').update({ is_finalized: true }).where({
      tranche_id: completeTrancheDto.trancheId,
    });
  }
}
