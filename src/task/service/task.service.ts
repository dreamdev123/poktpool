import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { Cron, Interval } from '@nestjs/schedule';
import { PoktscanService } from './poktscan.service';
import { StakingVerfService } from './staking.verf.service';
import { WalletVerfService } from './wallet.verf.service';
import { STAGE } from 'src/constants';
// import { BuyVerfService } from './buy.verf.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly configService: ConfigService,
    private readonly poktscanService: PoktscanService,
    private readonly walletVerfService: WalletVerfService,
    private readonly stakingVerfService: StakingVerfService, // private readonly buyVerfService: BuyVerfService,
  ) {}

  private async isCronEnabled(): Promise<boolean> {
    if (this.configService.get('ENABLE_CRON') !== '1') {
      console.log('CRON_DISABLED_ENV', this.configService.get('ENABLE_CRON'));
      return false;
    }

    return await new Promise((resolve) => {
      exec('./mastercheck.sh', (error, stdout, stderr) => {
        console.log('CRON_DISABLED_MASTER', error);
        resolve(error || stderr ? false : true);
      });
    });
  }

  @Cron('0 0 0 * * *')
  async vendorNetworkRewards() {
    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('VENDOR_NETWORK_REWARDS_CRON disabled');
      return;
    }
    console.log('VENDOR_NETWORK_REWARDS_CRON start');

    if (this.configService.get('STAGE') === STAGE.PRE_PROD) {
      return;
    }

    try {
      await this.poktscanService.vendorNetworkRewards();
      console.log('VENDOR_NETWORK_REWARDS_CRON_DONE');
    } catch (err) {
      console.log('VENDOR_NETWORK_REWARDS_CRON_ERROR', err);
    }
  }

  // every 15 mins
  @Interval(15 * 60 * 1000)
  async walletVerification() {
    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('WALLET_VERF_CRON disabled');
      return;
    }
    console.log('WALLET_VERF_CRON start');

    try {
      await this.walletVerfService.checkWallets();
    } catch (err) {
      console.log(err);
    }
  }

  // every 15 mins
  @Interval(15 * 60 * 1000)
  async stakeTxVerficiation() {
    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('STAKE_TX_VERF_CRON disabled');
      return;
    }
    console.log('STAKE_TX_VERF_CRON start');

    try {
      await this.stakingVerfService.checkWalletTxns();
    } catch (err) {
      console.log(err);
    }
  }
  /*
  // every 10 mins
  @Interval(10 * 60 * 1000)
  async expireBuyCommits() {
    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('EXPIRE_BUY_COMMIT_CRON disabled');
      return;
    }
    console.log('EXPIRE_BUY_COMMIT_CRON start');

    try {
      await this.buyVerfService.expireBuyCommits();
    } catch (err) {
      console.log(err);
    }
  }

  // every 10 mins
  @Interval(10 * 60 * 1000)
  async checkBuyCommits() {
    const isEnabled = await this.isCronEnabled();
    if (!isEnabled) {
      console.log('CHECK_BUY_COMMIT_CRON disabled');
      return;
    }
    console.log('CHECK_BUY_COMMIT_CRON start');

    try {
      await this.buyVerfService.checkBuyCommits();
    } catch (err) {
      console.log(err);
    }
  }
  */
}
