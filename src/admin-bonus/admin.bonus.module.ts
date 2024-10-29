import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { PocketModule } from 'src/pocket/pocket.module';
import { AdminBonusController } from './controllers/admin.bonus.controller';
import { AdminBonusService } from './services/admin.bonus.service';

@Module({
  imports: [PocketModule, TypeOrmModule.forFeature([PoktPoolUser])],
  controllers: [AdminBonusController],
  providers: [AdminBonusService],
})
export class AdminBonusModule {}
