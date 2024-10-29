import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { VendorToAggregatedDto } from '../dto/vendor-to-aggregated.dto';
import { ConnectionName } from 'src/database/enums/connection.enum';
import BigNumber from 'bignumber.js';
import { PocketService } from 'src/pocket/services/pocket.service';
import { TRANCHE_TXN, VENDOR, VENDOR_POOL_ADMIN, WALLET } from '../admin.types';
import { CHAIN_TXN_TYPE_CODE } from '../enums/admin.enum';
import { TXN_STATUS } from 'src/constants';

const ONE_DAY = 24 * 3600 * 1000;
const minusFee = (value) => BigNumber.maximum(value.minus(500000), 0);

@Injectable()
export class AdminVendorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  private async getSweepAmount({
    vendor_pool_admin,
    fromBalance,
    trancheId,
  }: {
    vendor_pool_admin: VENDOR_POOL_ADMIN;
    fromBalance: BigNumber;
    trancheId: number;
  }): Promise<{ sweepAmount: BigNumber; revShareAmount: BigNumber }> {
    if (vendor_pool_admin.deduct_revshare && vendor_pool_admin.rev_share_rate > 0) {
      let revShareAmount: BigNumber;
      if (vendor_pool_admin.rev_share_over === 'Zero') {
        revShareAmount = fromBalance.multipliedBy(vendor_pool_admin.rev_share_rate).decimalPlaces(0);
      }
      // network average
      else {
        const { tranche_start_time } = await this.knex('tranche')
          .first('tranche_start_time')
          .where({ tranche_id: trancheId });
        const tranchePeriod = Math.max(
          Date.now() / ONE_DAY - new Date(tranche_start_time).getTime() / ONE_DAY,
          1,
        );

        const { avg_rewards_nodes_24hr: network_average } = await this.nodeKnex('vw_avg_rewards')
          .first('avg_rewards_nodes_24hr')
          .where({
            network_id: 1,
            tier: 1,
          });

        const { staked_pokt } = await this.nodeKnex('vw_vendor_stakes').first('staked_pokt').where({
          vendor_id: vendor_pool_admin.vendor_id,
          pool_id: 1,
        });
        const vendorPerformance = fromBalance.dividedBy(new BigNumber(staked_pokt).dividedBy(15000));
        const rewardsAboveNetwork = vendorPerformance
          .dividedBy(tranchePeriod)
          .minus(new BigNumber(network_average).multipliedBy(1e6));

        revShareAmount = rewardsAboveNetwork.isGreaterThan(0)
          ? rewardsAboveNetwork.multipliedBy(vendor_pool_admin.rev_share_rate).decimalPlaces(0)
          : new BigNumber(0);
      }

      return {
        revShareAmount: BigNumber.maximum(revShareAmount, 0),
        sweepAmount: minusFee(fromBalance.minus(revShareAmount)),
      };
    }
    // all sweep
    else {
      return {
        revShareAmount: new BigNumber(0),
        sweepAmount: minusFee(fromBalance),
      };
    }
  }

  private async sendVendorToAgg({
    vendor,
    aggWallet,
    blockId,
    trancheId,
  }: {
    vendor: VENDOR;
    aggWallet: WALLET;
    blockId: number;
    trancheId: number;
  }) {
    const { vendor_id, vendor_pool_admin, revshare_wallet, reward_sweep_wallet } = vendor;

    const fromBalance = await (async () => {
      try {
        return await this.pocketService.getWalletBalance({
          walletAddress: reward_sweep_wallet.wallet_address,
          blockId,
        });
      } catch (err) {
        console.log(err);

        const failedTx: TRANCHE_TXN = {
          vendor_id,
          pool_id: 1,
          tranche_id: trancheId,
          from_wallet_id: reward_sweep_wallet.wallet_id,
          to_wallet_id: aggWallet.wallet_id,
          txn_timestamp: new Date().toISOString(),
          block_id: blockId,
          chain_txn_type_code: CHAIN_TXN_TYPE_CODE.PROVIDER_SWEEP_AGGREGATION,
          memo: [
            new Date().toLocaleDateString(),
            CHAIN_TXN_TYPE_CODE.PROVIDER_SWEEP_AGGREGATION,
            vendor_id,
          ].join(' | '),
          amount: '0',
          txn_success: false,
          network_txn_hash: null,
        };
        await this.nodeKnex('tranche_txn').insert(failedTx);

        throw err;
      }
    })();

    const { sweepAmount, revShareAmount } = await this.getSweepAmount({
      vendor_pool_admin,
      fromBalance,
      trancheId,
    });

    // sweep transaction
    const sweepTx: TRANCHE_TXN = {
      vendor_id,
      pool_id: 1,
      tranche_id: trancheId,
      from_wallet_id: reward_sweep_wallet.wallet_id,
      to_wallet_id: aggWallet.wallet_id,
      txn_timestamp: new Date().toISOString(),
      block_id: blockId,
      chain_txn_type_code: CHAIN_TXN_TYPE_CODE.PROVIDER_SWEEP_AGGREGATION,
      memo: [new Date().toLocaleDateString(), CHAIN_TXN_TYPE_CODE.PROVIDER_SWEEP_AGGREGATION, vendor_id].join(
        ' | ',
      ),
      amount: sweepAmount.toFixed(0),
      txn_success: false,
      network_txn_hash: null,
    };
    try {
      const { txHash, amount } = await this.pocketService.transferPOKT({
        fromWalletAddress: reward_sweep_wallet.wallet_address,
        toWalletAddress: aggWallet.wallet_address,
        amount: sweepAmount,
        considerFee: false,
        memo: sweepTx.memo,
      });
      sweepTx.amount = amount.toFixed(0);
      sweepTx.txn_success = true;
      sweepTx.network_txn_hash = txHash;
    } catch (err) {
      console.log(err);
    }
    await this.nodeKnex('tranche_txn').insert(sweepTx);

    // rev share transaction
    if (vendor_pool_admin.deduct_revshare) {
      const revShareTx: TRANCHE_TXN = {
        vendor_id,
        pool_id: 1,
        tranche_id: trancheId,
        from_wallet_id: reward_sweep_wallet.wallet_id,
        to_wallet_id: revshare_wallet?.wallet_id || null,
        txn_timestamp: new Date().toISOString(),
        block_id: blockId,
        chain_txn_type_code: CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PROVIDER,
        memo: [new Date().toLocaleDateString(), CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PROVIDER, vendor_id].join(
          ' | ',
        ),
        amount: revShareAmount.toFixed(0),
        txn_success: false,
        network_txn_hash: null,
      };
      if (revShareAmount.isEqualTo(0)) {
        revShareTx.txn_success = true;
      } else if (revshare_wallet) {
        try {
          const { txHash, amount } = await this.pocketService.transferPOKT({
            fromWalletAddress: reward_sweep_wallet.wallet_address,
            toWalletAddress: revshare_wallet.wallet_address,
            amount: revShareAmount,
            considerFee: false,
            memo: revShareTx.memo,
          });
          revShareTx.amount = amount.toFixed(0);
          revShareTx.txn_success = true;
          revShareTx.network_txn_hash = txHash;
        } catch (err) {
          console.log(err);
        }
      }
      await this.nodeKnex('tranche_txn').insert(revShareTx);
    }
  }

  async vendorToAggregated(vendorToAggregatedDto: VendorToAggregatedDto) {
    const alreadyProcessed = await this.nodeKnex('tranche_txn')
      .first('*')
      .where({ tranche_id: vendorToAggregatedDto.trancheId });
    if (alreadyProcessed) {
      throw new BadRequestException('Bad request');
    }

    const poolId = 1;
    const pool = await this.nodeKnex('pool').first('*').where({
      pool_id: poolId,
    });
    const aggWallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      wallet_id: pool.sweeps_wallet_id,
    });
    const vendors = await this.getActiveVendors();

    const errors = [];
    for (const vendor of vendors) {
      try {
        await this.sendVendorToAgg({
          vendor,
          aggWallet,
          blockId: vendorToAggregatedDto.blockId,
          trancheId: vendorToAggregatedDto.trancheId,
        });
      } catch (err) {
        console.log(err);
        errors.push(err.message);
      }
    }

    return { errors };
  }

  private async getActiveVendors(): Promise<VENDOR[]> {
    const vendors = await this.nodeKnex('vendor_pool_admin')
      .select(
        'vendor.vendor_id',
        'vendor.vendor_name',
        this.nodeKnex.raw('row_to_json(vendor_pool_admin.*) as vendor_pool_admin'),
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('vendor_pool_admin.revshare_wallet_id') })
          .as('revshare_wallet'),
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('vendor_pool_admin.reward_sweep_wallet_id') })
          .as('reward_sweep_wallet'),
        // this.nodeKnex.raw(
        //   '(select row_to_json(_) from (select "vendor_pool_admin".*) as _) as vendor_pool_admin',
        // ),
        // this.nodeKnex.raw(
        //   `(SELECT row_to_json(_) FROM (
        //     SELECT wallet.* FROM wallet WHERE wallet.wallet_id = vendor_pool_admin.revshare_wallet_id LIMIT 1
        //   ) AS _) AS revshare_wallet`,
        // ),
      )
      .innerJoin('vendor', 'vendor_pool_admin.vendor_id', 'vendor.vendor_id')
      .where({
        'vendor_pool_admin.pool_id': 1,
        'vendor_pool_admin.is_active': true,
      });
    return vendors;
  }

  async getVendorToAggregated(trancheId: number) {
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
      .whereIn('chain_txn_type_code', [
        CHAIN_TXN_TYPE_CODE.PROVIDER_SWEEP_AGGREGATION,
        CHAIN_TXN_TYPE_CODE.REV_SHARE_TO_PROVIDER,
      ]);

    await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.network_txn_hash) {
          transaction.network_txn_status = await this.pocketService.getTxStatus(transaction.network_txn_hash);
        }
      }),
    );

    // enableProceedButton
    const tranche = await this.knex.first('*').from('tranche').where({ tranche_id: trancheId });
    const disableProceedButton =
      transactions.length === 0 ||
      transactions.some(
        ({ txn_success, network_txn_hash, network_txn_status }) =>
          !txn_success || (network_txn_hash && network_txn_status !== TXN_STATUS.SUCCESS),
      );
    const enableProceedButton = tranche.tranche_status === 'Open' && !disableProceedButton;

    // aggregated wallet balance
    const blockId = await this.pocketService.getBlockHeight();
    const poolId = 1;
    const pool = await this.nodeKnex('pool').first('*').where({
      pool_id: poolId,
    });
    const aggWallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      wallet_id: pool.sweeps_wallet_id,
    });
    const balance = await this.pocketService.getWalletBalance({
      walletAddress: aggWallet.wallet_address,
      blockId,
    });

    return {
      transactions,
      aggregated_wallet_balance: balance.toFixed(0),
      enableProceedButton,
    };
  }

  async getVendorWalletBalances(trancheId: number) {
    const poolId = 1;
    const blockId = await this.pocketService.getDBBlockHeight();

    const pool = await this.nodeKnex('pool').first('*').where({
      pool_id: poolId,
    });
    const aggWallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      wallet_id: pool.sweeps_wallet_id,
    });
    const tranche = await this.knex.first('*').from('tranche').where({ tranche_id: trancheId });
    const alreadyProcessed = await this.nodeKnex('tranche_txn').first('*').where({ tranche_id: trancheId });

    const transactions = [];
    const vendors = await this.getActiveVendors();

    for (const vendor of vendors) {
      const balance = await this.pocketService.getWalletBalance({
        walletAddress: vendor.reward_sweep_wallet.wallet_address,
        blockId,
      });
      const inbound_time = await this.pocketService.getLastInboundTxTime(
        vendor.reward_sweep_wallet.wallet_address,
        blockId,
      );
      vendor.balance = {
        value: balance.toFixed(0),
        inbound_time,
      };
      const { staked_pokt } = await this.nodeKnex('vw_vendor_stakes').first('staked_pokt').where({
        vendor_id: vendor.vendor_id,
        pool_id: 1,
      });
      vendor.earned_per_15k = new BigNumber(staked_pokt).isGreaterThan(1)
        ? balance.div(new BigNumber(staked_pokt).div(15000)).div(1e6).toFixed(2)
        : 'NA';

      const { sweepAmount, revShareAmount } = await this.getSweepAmount({
        vendor_pool_admin: vendor.vendor_pool_admin,
        fromBalance: balance,
        trancheId,
      });
      transactions.push({
        from: vendor.reward_sweep_wallet.wallet_name,
        to: aggWallet.wallet_name,
        amount: sweepAmount.toFixed(0),
      });
      if (vendor.vendor_pool_admin.deduct_revshare) {
        transactions.push({
          from: vendor.reward_sweep_wallet.wallet_name,
          to: vendor.revshare_wallet?.wallet_name,
          amount: revShareAmount.toFixed(0),
        });
      }
    }
    return {
      blockId,
      vendors,
      transactions,
      enableTransferButton: tranche.tranche_status === 'Open' && !alreadyProcessed,
    };
  }
}
