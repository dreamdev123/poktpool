import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminSellService } from './services/admin.sell.service';
import { AdminSellController } from './controllers/admin.sell.controller';
import { PocketModule } from 'src/pocket/pocket.module';
import { Customer } from 'src/auth/entities/customer.entity';

@Module({
  imports: [PocketModule, TypeOrmModule.forFeature([PoktPoolUser, Customer])],
  controllers: [AdminSellController],
  providers: [AdminSellService],
})
export class AdminSellModule {}
