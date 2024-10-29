import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { TXN_STATUS } from 'src/constants';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';
import { SALE_COMMIT_STATUS, SALE_COMMIT_TXN } from 'src/types/sale_commit_txn';

@Injectable()
export class BuyVerfService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async expireBuyCommits() {
    await this.knex('sale_commit_txn')
      .update({
        sale_commit_status: SALE_COMMIT_STATUS.EXPIRED,
      })
      .where({
        sale_commit_status: SALE_COMMIT_STATUS.PENDING,
      })
      .where('commit_exp_timestamp', '>', new Date().toISOString());
  }

  async checkOneCommit(sale_commit_txn: SALE_COMMIT_TXN) {
    const txn_hashes = [];

    if (sale_commit_txn.distribution_txn_hash) {
      txn_hashes.push(sale_commit_txn.distribution_txn_hash);
    }
    if (sale_commit_txn.distribution_wallet_txn_id) {
      const wallet_txn = await this.knex('wallet_txn').first('*').where({
        wallet_txn_id: sale_commit_txn.distribution_wallet_txn_id,
      });
      txn_hashes.push(wallet_txn.network_txn_id);
    }

    for (const txn_hash of txn_hashes) {
      const tx_status = await this.pocketService.getTxStatus(txn_hash);

      if (tx_status === TXN_STATUS.FAILED) {
        await this.knex('sale_commit_txn')
          .update({
            sale_commit_status: SALE_COMMIT_STATUS.ERROR,
          })
          .where({
            sale_commit_id: sale_commit_txn.sale_commit_id,
          });
        return;
      }
      if (tx_status !== TXN_STATUS.SUCCESS) return;
    }

    await this.knex('sale_commit_txn')
      .update({
        sale_commit_status: SALE_COMMIT_STATUS.COMPLETE,
      })
      .where({
        sale_commit_id: sale_commit_txn.sale_commit_id,
      });
  }

  async checkBuyCommits() {
    const sale_commit_txns: SALE_COMMIT_TXN[] = await this.knex('sale_commit_txn').select('*').where({
      sale_commit_status: SALE_COMMIT_STATUS.TRANSFERRING,
    });

    for (const sale_commit_txn of sale_commit_txns) {
      await this.checkOneCommit(sale_commit_txn);
    }
  }
}
