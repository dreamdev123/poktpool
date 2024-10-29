import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { NotificationService } from 'src/pocket/services/notification.service';
import { PocketService } from 'src/pocket/services/pocket.service';

@Injectable()
export class StakingVerfService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
    private readonly pocketService: PocketService,
  ) {}

  private async checkTxn(txn) {
    const txData = await this.pocketService.getTxData(txn.network_txn_id);
    if (!txData) {
      if (Date.now() - new Date(txn.txn_timestamp).getTime() < 24 * 3600 * 1000) {
        return;
      }

      await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
        txn.wallet_txn_id,
        0,
        0,
        7,
        `FAILED - TX hash ${txn.network_txn_id} not found on blockchain!`,
      ]);
      this.notificationService
        .sendStakingFailedEmail(txn, 'Transaction not found on blockchain.')
        .catch(console.log);
      return;
    }

    const { tx_result, stdTx } = txData;

    if (tx_result.code === 5 || tx_result.code === 10) {
      await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
        txn.wallet_txn_id,
        0,
        0,
        10,
        `FAILED - Insufficient funds!`,
      ]);
      this.notificationService
        .sendStakingFailedEmail(txn, 'Transaction failed - Insufficient funds.')
        .catch(console.log);
      return;
    }

    const isSend = tx_result.code === 0 && tx_result.message_type === 'send';
    if (!isSend) {
      await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
        txn.wallet_txn_id,
        0,
        0,
        1,
        `FAILED - TX hash ${txn.network_txn_id}`,
      ]);
      this.notificationService.sendStakingFailedEmail(txn, 'Transaction failed.').catch(console.log);
      return;
    }

    const amount = stdTx.msg.value.amount;
    const to_address = stdTx.msg.value.to_address.toUpperCase();
    const from_address = stdTx.msg.value.from_address.toUpperCase();

    if (to_address !== this.configService.get('stakeWallet')) {
      await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
        txn.wallet_txn_id,
        0,
        0,
        6,
        `FAILED - Transaction destination mismatch for hash ${txn.network_txn_id}`,
      ]);
      this.notificationService
        .sendStakingFailedEmail(txn, 'Transaction destination mismatch.')
        .catch(console.log);
      return;
    }

    if (from_address !== txn.sender_wallet_id?.toUpperCase()) {
      await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
        txn.wallet_txn_id,
        0,
        0,
        5,
        `FAILED - User wallet mismatch! Expected ${txn.sender_wallet_id?.toUpperCase()} and got ${from_address}`,
      ]);
      this.notificationService.sendStakingFailedEmail(txn, 'User wallet mismatch.').catch(console.log);
      return;
    }

    await this.knex.raw('CALL verify_wallet_txn(?,?,?,?,?)', [
      txn.wallet_txn_id,
      amount,
      txData.height,
      0,
      'SUCCESS',
    ]);
    this.notificationService.sendStakingVerifiedEmail(txn).catch(console.log);
  }

  async checkWalletTxns() {
    const pendingTxns = await this.knex('wallet_txn')
      .select('*')
      .whereIn('verification_code', [2, 3])
      .andWhere({
        currency_code: 1,
        txn_type_code: 6,
      });

    for (const txn of pendingTxns) {
      try {
        await this.checkTxn(txn);
      } catch (err) {
        console.log(err);
      }
    }
  }
}
