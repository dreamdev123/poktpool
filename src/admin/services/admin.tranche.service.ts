import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';

@Injectable()
export class AdminTrancheService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getTrancheDetails(trancheId: string) {
    const tranche_stats = await this.knex
      .first('*')
      .from('vw_pp_tranche_stats')
      .where({ tranche_id: trancheId });

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
      .where({ tranche_id: trancheId });
    await Promise.all(
      transactions.map(async (transaction) => {
        if (transaction.network_txn_hash) {
          transaction.network_txn_status = await this.pocketService.getTxStatus(transaction.network_txn_hash);
        }
      }),
    );

    return { tranche_stats, transactions };
  }
}
