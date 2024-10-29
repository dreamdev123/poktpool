import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminVendorService } from './services/admin.vendor.service';
import { PocketModule } from 'src/pocket/pocket.module';
import { AdminDistributeService } from './services/admin.distribute.service';
import { AdminWalletService } from './services/admin.wallet.service';
import { AdminWalletController } from './controllers/admin.wallet.controller';
import { AdminNodeController } from './controllers/admin.node.controller';
import { AdminNodeService } from './services/admin.node.service';
import { AdminProviderController } from './controllers/admin.provider.controller';
import { AdminProviderService } from './services/admin.provider.service';
import { AdminTrancheController } from './controllers/admin.tranche.controller';
import { AdminTrancheService } from './services/admin.tranche.service';
import { AdminMemberController } from './controllers/admin.member.controller';
import { AdminMemberService } from './services/admin.member.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PoktPoolUser, Customer]), PocketModule],
  controllers: [
    AdminController,
    AdminWalletController,
    AdminNodeController,
    AdminProviderController,
    AdminTrancheController,
    AdminMemberController,
  ],
  providers: [
    AdminService,
    AdminVendorService,
    AdminDistributeService,
    AdminWalletService,
    AdminNodeService,
    AdminProviderService,
    AdminTrancheService,
    AdminMemberService,
  ],
  exports: [AdminService],
})
export class AdminModule {}
