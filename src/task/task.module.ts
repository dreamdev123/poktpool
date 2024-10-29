import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskService } from './service/task.service';
import { HttpModule } from '@nestjs/axios';
import { PoktscanService } from './service/poktscan.service';
import { WalletVerfService } from './service/wallet.verf.service';
import { StakingVerfService } from './service/staking.verf.service';
import { PocketModule } from 'src/pocket/pocket.module';
import { BuyVerfService } from './service/buy.verf.service';

@Module({
  imports: [HttpModule, ConfigModule, PocketModule],
  providers: [TaskService, PoktscanService, WalletVerfService, StakingVerfService, BuyVerfService],
})
export class TaskModule {}
