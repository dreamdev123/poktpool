import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { PocketModule } from 'src/pocket/pocket.module';
import { AdminPricingModelController } from './controllers/admin.pricingmodel.controller';
import { AdminPricingModelService } from './services/admin.pricingmodel.service';

@Module({
  imports: [PocketModule, TypeOrmModule.forFeature([PoktPoolUser])],
  controllers: [AdminPricingModelController],
  providers: [AdminPricingModelService],
})
export class AdminPricingModelModule {}
