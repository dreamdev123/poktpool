import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { CustomerModule } from 'src/customer/customer.module';
import { OneTimeCodeModule } from 'src/one-time-code/one-time-code.module';
import { WithdrawController } from './controllers/withdraw.controller';
import { WithdrawService } from './services/withdraw.service';

@Module({
  imports: [TypeOrmModule.forFeature([PoktPoolUser, Customer]), CustomerModule, OneTimeCodeModule],
  controllers: [WithdrawController],
  providers: [WithdrawService],
  exports: [WithdrawService],
})
export class WithdrawModule {}
