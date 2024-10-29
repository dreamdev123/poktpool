import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from './pocket.service';
import { NETWORK_ID } from 'src/constants';
import { WALLET } from 'src/admin/admin.types';
import { SALE_COMMIT_STATUS, SALE_COMMIT_TXN } from 'src/types/sale_commit_txn';
import { WALLET_TYPE_CODE } from 'src/types/wallet';

@Injectable()
export class BuyUtilService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getBalances() {
    const pokt_sales_wallet: WALLET = await this.nodeKnex('wallet').first('*').where({
      network_id: NETWORK_ID.POKT,
      wallet_type_code: WALLET_TYPE_CODE.POKT_SALES,
    });
    if (!pokt_sales_wallet) {
      throw new InternalServerErrorException('POKT sales wallet not found');
    }
    const blockId = await this.pocketService.getBlockHeight();
    const pokt_sales_balance = await this.pocketService.getWalletBalance({
      walletAddress: pokt_sales_wallet.wallet_address,
      blockId,
    });
    const current_balance = pokt_sales_balance.div(1e6).toNumber();

    const pending_txns: SALE_COMMIT_TXN[] = await this.knex('sale_commit_txn')
      .select('*')
      .whereIn('sale_commit_status', [SALE_COMMIT_STATUS.PENDING, SALE_COMMIT_STATUS.TRANSFERRING]);
    const pending = pending_txns.reduce(
      (agg, txn) =>
        agg +
        Number(
          txn.sale_commit_status === SALE_COMMIT_STATUS.PENDING
            ? txn.token_amount
            : txn.token_amount_processed,
        ),
      0,
    );

    const sold_txns: SALE_COMMIT_TXN[] = await this.knex('sale_commit_txn')
      .select('*')
      .where('sale_commit_status', SALE_COMMIT_STATUS.COMPLETE);
    const sold = sold_txns.reduce((agg, txn) => agg + Number(txn.token_amount_processed), 0);

    const available = Math.max(0, current_balance - pending);
    return {
      current_balance,
      pending,
      sold,
      available,
    };
  }
}
