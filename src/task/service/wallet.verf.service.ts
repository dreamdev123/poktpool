import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { NotificationService } from 'src/pocket/services/notification.service';
import { WALLET_VERF_REQ } from 'src/types/wallet_verf_req';
import { WALLET_VERF_STATUS } from 'src/wallet/wallet.constants';

@Injectable()
export class WalletVerfService {
  constructor(
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  private async checkWalletStatus(wallet: WALLET_VERF_REQ) {
    const stakeWallet = this.configService.get('stakeWallet');

    const verfTx = await this.nodeKnex('network_txn')
      .first('*')
      .where({
        network_id: 1,
        from_wallet_address: wallet.wallet_address,
        to_wallet_address: stakeWallet,
        amount: wallet.verf_amount,
        txn_currency_code: 1,
        network_txn_type: 'send',
        result_code: 0,
      })
      .where(
        'txn_timestamp',
        '>',
        new Date(new Date(wallet.req_timestamp).getTime() - 3600 * 1000).toISOString(),
      );

    const updates = {
      last_check_timestamp: new Date().toISOString(),
    };
    // verified
    if (verfTx) {
      Object.assign(updates, {
        req_status: WALLET_VERF_STATUS.VERIFIED,
        verf_txn_hash: verfTx.network_txn_hash,
      });
      this.notificationService.sendWalletVerifiedEmail(wallet).catch(console.log);
    }
    // expired
    else if (Date.now() > new Date(wallet.exp_timestamp).getTime()) {
      Object.assign(updates, {
        req_status: WALLET_VERF_STATUS.EXPIRED,
      });
      this.notificationService.sendWalletExpiredEmail(wallet).catch(console.log);
    }

    // update
    await this.knex('wallet_verf_req').update(updates).where({
      verf_req_id: wallet.verf_req_id,
    });
    if (verfTx) return true;
  }

  public async checkWallets() {
    let refreshView = false;

    const pendingWallets: WALLET_VERF_REQ[] = await this.knex('wallet_verf_req').select('*').where({
      req_status: WALLET_VERF_STATUS.PENDING,
    });
    for (const wallet of pendingWallets) {
      if (await this.checkWalletStatus(wallet)) {
        refreshView = true;
      }
    }

    if (refreshView) {
      await this.knex.raw('refresh MATERIALIZED view vw_wallet_list;');
    }
  }
}
