import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import BigNumber from 'bignumber.js';
import { PocketService } from 'src/pocket/services/pocket.service';
import { DistributePostTrancheDto } from '../dto/distribute-post-tranche.dto';
import {
  POOL,
  POOL_WALLETS,
  SWEEP_REQ_HIST,
  TRANCHE_STATS,
  TRANCHE_TXN,
  UNSTAKE_DUE,
  WALLET,
} from '../admin.types';
import { CHAIN_TXN_TYPE_CODE, DISTRIBUTE_CHAIN_TXN_TYPE_CODES } from '../enums/admin.enum';
import { NotificationService } from 'src/pocket/services/notification.service';

@Injectable()
export class AdminDistributeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    private readonly notificationService: NotificationService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getTransferParams({
    wallets,
    tranche_stats,
    chain_txn_type_code,
  }: {
    wallets: POOL_WALLETS;
    tranche_stats: TRANCHE_STATS;
    chain_txn_type_code: number;
  }): Promise<{
    fromWallet: WALLET;
    toWallet: WALLET;
    amount: BigNumber;
    considerFee: boolean;
  }> {
    // Injections to Liquid
    if (chain_txn_type_code === 1) {
      return {
        fromWallet: wallets.stake_wallet,
        toWallet: wallets.liquid_wallet,
        amount: new BigNumber(tranche_stats.new_equity_injected).absoluteValue().multipliedBy(1e6),
        considerFee: false,
      };
    }
    // Rollovers to Liquid
    if (chain_txn_type_code === 2) {
      return {
        fromWallet: wallets.sweeps_wallet,
        toWallet: wallets.liquid_wallet,
        amount: new BigNumber(tranche_stats.rollovers).absoluteValue().multipliedBy(1e6),
        considerFee: false,
      };
    }
    // Infrastructure Fees to PPINC
    if (chain_txn_type_code === 3) {
      return {
        fromWallet: wallets.sweeps_wallet,
        toWallet: wallets.fees_wallet,
        amount: new BigNumber(tranche_stats.infrastructure_fees).absoluteValue().multipliedBy(1e6),
        considerFee: false,
      };
    }
    // Rev Share to PPINC
    if (chain_txn_type_code === 4) {
      return {
        fromWallet: wallets.sweeps_wallet,
        toWallet: wallets.fees_wallet,
        amount: new BigNumber(tranche_stats.commissions).absoluteValue().multipliedBy(1e6),
        considerFee: false,
      };
    }
    // // Sweeps to Sweep/Unstake
    // if (chain_txn_type_code === 5) {
    //   return {
    //     fromWallet: wallets.sweeps_wallet,
    //     toWallet: wallets.distribution_wallet,
    //     amount: new BigNumber(tranche_stats.sweeps_tosend).absoluteValue().multipliedBy(1e6),
    //     considerFee: false,
    //   };
    // }
    // // Balance Unstakes to Sweep/Unstake
    // if (chain_txn_type_code === 6) {
    //   return {
    //     fromWallet: wallets.liquid_wallet,
    //     toWallet: wallets.distribution_wallet,
    //     amount: new BigNumber(tranche_stats.unstakes_tosend).absoluteValue().multipliedBy(1e6),
    //     considerFee: false,
    //   };
    // }
    // Reward Unstakes to Sweep/Unstake
    if (chain_txn_type_code === 7) {
      return {
        fromWallet: wallets.sweeps_wallet,
        toWallet: wallets.liquid_wallet,
        amount: new BigNumber(tranche_stats.rewards_unstaked).absoluteValue().multipliedBy(1e6),
        considerFee: false,
      };
    }

    throw new Error('Invalid txn type');
  }

  private async recordFeeDistribution({ transferTx, fromWalletAddress, toWalletAddress }) {
    let txn_type_code = null;
    if (transferTx.chain_txn_type_code === CHAIN_TXN_TYPE_CODE.INFRA_FEES_TO_PPINC) {
      txn_type_code = 22;
    } else if (transferTx.chain_txn_type_code === CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PPINC) {
      txn_type_code = 21;
    } else {
      return;
    }

    try {
      if (transferTx.network_txn_hash) {
        await this.knex.raw('SELECT fee_distribution(?,?,?,?,?,?)', [
          1, // pool id
          txn_type_code,
          transferTx.network_txn_hash,
          transferTx.amount,
          fromWalletAddress,
          toWalletAddress,
        ]);
      }
    } catch (err) {
      console.log(err);
    }
  }

  private async checkAggBalance(
    sweeps_wallet: WALLET,
    tranche_stats: TRANCHE_STATS,
    sweeps: SWEEP_REQ_HIST[],
    blockId: number,
  ) {
    const balance = await this.pocketService.getWalletBalance({
      walletAddress: sweeps_wallet.wallet_address,
      blockId,
    });
    let requiredBalance = new BigNumber(0)
      .plus(new BigNumber(tranche_stats.rollovers).absoluteValue())
      .plus(new BigNumber(tranche_stats.infrastructure_fees).absoluteValue())
      .plus(new BigNumber(tranche_stats.commissions).absoluteValue())
      // .plus(new BigNumber(tranche_stats.sweeps_tosend).absoluteValue())
      .plus(new BigNumber(tranche_stats.rewards_unstaked).absoluteValue())
      .plus(1)
      .multipliedBy(1e6);
    for (const sweep of sweeps) {
      requiredBalance = requiredBalance.plus(new BigNumber(sweep.amt_swept).absoluteValue()).plus(0.01 * 1e6);
    }
    if (requiredBalance.isGreaterThan(balance)) {
      throw new InternalServerErrorException(
        'Insufficient balance (aggregated wallet) Required: ' +
          requiredBalance.dividedBy(1e6).toFixed(0) +
          ' Available: ' +
          balance.dividedBy(1e6).toFixed(0),
      );
    }
  }

  private async checkLiquidBalance(liquid_wallet: WALLET, unstakes: UNSTAKE_DUE[], blockId: number) {
    const balance = await this.pocketService.getWalletBalance({
      walletAddress: liquid_wallet.wallet_address,
      blockId,
    });
    let requiredBalance = new BigNumber(0);
    for (const unstake of unstakes) {
      requiredBalance = requiredBalance.plus(new BigNumber(unstake.amount).absoluteValue()).plus(0.01 * 1e6);
    }
    if (requiredBalance.isGreaterThan(balance)) {
      throw new InternalServerErrorException(
        'Insufficient balance (liquid wallet) Required: ' +
          requiredBalance.dividedBy(1e6).toFixed(0) +
          ' Available: ' +
          balance.dividedBy(1e6).toFixed(0),
      );
    }
  }

  private async sendPostTrancheTxs(
    wallets: POOL_WALLETS,
    tranche_stats: TRANCHE_STATS,
    pool_id: number,
    blockId: number,
  ) {
    const errors = [];
    for (const chain_txn_type_code of [
      CHAIN_TXN_TYPE_CODE.INJECTIONS_TO_LIQUID,
      CHAIN_TXN_TYPE_CODE.ROLLOVERS_TO_LIQUID,
      CHAIN_TXN_TYPE_CODE.INFRA_FEES_TO_PPINC,
      CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PPINC,
      CHAIN_TXN_TYPE_CODE.REWARD_UNSTAKES_TO_SWEEP,
    ]) {
      try {
        const transferParams = await this.getTransferParams({
          wallets,
          tranche_stats,
          chain_txn_type_code,
        });
        const transferTx: TRANCHE_TXN = {
          pool_id,
          tranche_id: tranche_stats.tranche_id,
          from_wallet_id: transferParams.fromWallet.wallet_id,
          to_wallet_id: transferParams.toWallet.wallet_id,
          memo: [new Date().toLocaleDateString(), chain_txn_type_code].join(' | '),
          txn_timestamp: new Date().toISOString(),
          block_id: blockId,
          chain_txn_type_code,
          amount: transferParams.amount.toFixed(0),
          txn_success: false,
          network_txn_hash: null,
        };
        try {
          const { txHash, amount } = await this.pocketService.transferPOKT({
            fromWalletAddress: transferParams.fromWallet.wallet_address,
            toWalletAddress: transferParams.toWallet.wallet_address,
            amount: transferParams.amount,
            considerFee: transferParams.considerFee,
            memo: transferTx.memo,
          });
          transferTx.amount = amount.toFixed(0);
          transferTx.txn_success = true;
          transferTx.network_txn_hash = txHash;

          await this.recordFeeDistribution({
            transferTx,
            fromWalletAddress: transferParams.fromWallet.wallet_address,
            toWalletAddress: transferParams.toWallet.wallet_address,
          });
        } catch (err) {
          console.log(err);
        }
        await this.nodeKnex('tranche_txn').insert(transferTx);
      } catch (err) {
        console.log(err);
        errors.push(err.message);
      }
    }
    return errors;
  }

  private async sendSweeps(
    sweeps: SWEEP_REQ_HIST[],
    sweeps_wallet: WALLET,
    tranche_id: number,
    pool_id: number,
    blockId: number,
  ) {
    const errors = [];
    const memo = 'Sweep from poktpool';
    for (const sweep of sweeps) {
      try {
        const { txHash, amount } = await this.pocketService.transferPOKT({
          fromWalletAddress: sweeps_wallet.wallet_address,
          toWalletAddress: sweep.to_wallet,
          amount: new BigNumber(sweep.amt_swept).absoluteValue(),
          considerFee: false,
          memo,
        });
        await this.knex.raw('CALL process_sweep(?,?,?,?)', [
          sweep.sweep_req_id,
          txHash,
          amount.toFixed(0),
          1,
        ]);
        const transferTx: TRANCHE_TXN = {
          pool_id,
          tranche_id,
          from_wallet_id: sweeps_wallet.wallet_id,
          to_wallet_id: null,
          recipient_wallet_address: sweep.to_wallet,
          memo,
          txn_timestamp: new Date().toISOString(),
          block_id: blockId,
          chain_txn_type_code: CHAIN_TXN_TYPE_CODE.SWEEP_TO_MEMBER,
          amount: amount.toFixed(0),
          txn_success: true,
          network_txn_hash: txHash,
        };
        await this.nodeKnex('tranche_txn').insert(transferTx);

        await this.notificationService.sendSweepSentEmail(sweep, amount, txHash);
      } catch (err) {
        console.log(err);
        errors.push(err.message);
      }
    }
    return errors;
  }

  private async sendUnstakes(
    unstakes: UNSTAKE_DUE[],
    liquid_wallet: WALLET,
    tranche_id: number,
    pool_id: number,
    blockId: number,
  ) {
    const errors = [];
    const memo = 'Unstake from poktpool';
    for (const unstake of unstakes) {
      try {
        const { txHash, amount } = await this.pocketService.transferPOKT({
          fromWalletAddress: liquid_wallet.wallet_address,
          toWalletAddress: unstake.recpt_wallet,
          amount: new BigNumber(unstake.amount).absoluteValue(),
          considerFee: false,
          memo,
        });
        await this.knex.raw('CALL process_unstake(?,?,?)', [
          unstake.unstake_req_id,
          txHash,
          amount.toFixed(0),
        ]);
        const transferTx: TRANCHE_TXN = {
          pool_id,
          tranche_id,
          from_wallet_id: liquid_wallet.wallet_id,
          to_wallet_id: null,
          recipient_wallet_address: unstake.recpt_wallet,
          memo,
          txn_timestamp: new Date().toISOString(),
          block_id: blockId,
          chain_txn_type_code: CHAIN_TXN_TYPE_CODE.UNSTAKE_TO_MEMBER,
          amount: amount.toFixed(0),
          txn_success: true,
          network_txn_hash: txHash,
        };
        await this.nodeKnex('tranche_txn').insert(transferTx);

        this.notificationService.sendUnstakeSentEmail(unstake, amount, txHash).catch(console.log);
      } catch (err) {
        console.log(err);
        errors.push(err.message);
      }
    }
    return errors;
  }

  async distributePostTranche(distributePostTrancheDto: DistributePostTrancheDto) {
    const blockId = await this.pocketService.getBlockHeight();
    const tranche_id = distributePostTrancheDto.trancheId;
    const existingTxs = await this.nodeKnex('tranche_txn')
      .select('*')
      .where({
        pool_id: 1,
        tranche_id,
      })
      .whereIn('chain_txn_type_code', DISTRIBUTE_CHAIN_TXN_TYPE_CODES);
    if (existingTxs.length !== 0) {
      throw new BadRequestException('Bad request');
    }

    const tranche_stats: TRANCHE_STATS | null = await this.knex
      .first('*')
      .from('vw_pp_tranche_stats')
      .where({ tranche_id });
    if (!tranche_stats) {
      throw new BadRequestException('Bad request');
    }

    const pool_id = 1;
    const pool: POOL = await this.nodeKnex('pool').first('*').where({ pool_id });

    const [stake_wallet, distribution_wallet, sweeps_wallet, fees_wallet, liquid_wallet] = await Promise.all([
      this.nodeKnex('wallet').first('*').where({
        wallet_id: pool.stake_wallet_id,
        network_id: 1,
      }),
      this.nodeKnex('wallet').first('*').where({
        wallet_id: pool.distribution_wallet_id,
        network_id: 1,
      }),
      this.nodeKnex('wallet').first('*').where({
        wallet_id: pool.sweeps_wallet_id,
        network_id: 1,
      }),
      this.nodeKnex('wallet').first('*').where({
        wallet_id: pool.fees_wallet_id,
        network_id: 1,
      }),
      this.nodeKnex('wallet').first('*').where({
        wallet_id: pool.liquid_wallet_id,
        network_id: 1,
      }),
    ]);
    if (!stake_wallet || !distribution_wallet || !sweeps_wallet || !fees_wallet || !liquid_wallet) {
      throw new InternalServerErrorException('Missing Info');
    }
    const wallets: POOL_WALLETS = {
      stake_wallet,
      distribution_wallet,
      sweeps_wallet,
      fees_wallet,
      liquid_wallet,
    };

    // get sweeps
    const sweeps: SWEEP_REQ_HIST[] = await this.knex('sweep_req_hist')
      .select(['sweep_req_hist.*', 'customer.p_wallet_id as to_wallet'])
      .innerJoin('customer', 'customer.customer_id', 'sweep_req_hist.customer_id')
      .where({
        sweep_complete: false,
      });
    await this.checkAggBalance(sweeps_wallet, tranche_stats, sweeps, blockId);

    // get unstakes
    const unstakes: UNSTAKE_DUE[] = await this.knex('vw_unstakes_due').select('*');
    await this.checkLiquidBalance(liquid_wallet, unstakes, blockId);

    const trancheErrors = await this.sendPostTrancheTxs(wallets, tranche_stats, pool_id, blockId);
    console.log(trancheErrors);

    const sweepErrors = await this.sendSweeps(sweeps, sweeps_wallet, tranche_id, pool_id, blockId);
    console.log(sweepErrors);

    const unstakeErrors = await this.sendUnstakes(unstakes, liquid_wallet, tranche_id, pool_id, blockId);
    console.log(unstakeErrors);

    if ([...trancheErrors, ...sweepErrors, ...unstakeErrors].length > 0) {
      throw new InternalServerErrorException('Error! Please do NOT retry!');
    }
    return { errors: [] };
  }
}
