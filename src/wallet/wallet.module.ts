import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { WalletController } from './controllers/wallet.controller';
import { WalletService } from './services/wallet.service';

@Module({
  imports: [TypeOrmModule.forFeature([PoktPoolUser, Customer])],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
