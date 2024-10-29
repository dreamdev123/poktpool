import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StakeController } from './controllers/stake.controller';
import { StakeService } from './services/stake.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { CustomerModule } from 'src/customer/customer.module';
import { OneTimeCodeModule } from 'src/one-time-code/one-time-code.module';
import { PocketModule } from 'src/pocket/pocket.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PoktPoolUser, Customer]),
    CustomerModule,
    OneTimeCodeModule,
    PocketModule,
  ],
  controllers: [StakeController],
  providers: [StakeService],
  exports: [StakeService],
})
export class StakeModule {}
