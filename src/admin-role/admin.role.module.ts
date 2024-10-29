import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { PocketModule } from 'src/pocket/pocket.module';
import { AdminRoleController } from './controllers/admin.role.controller';
import { AdminRoleService } from './services/admin.role.service';

@Module({
  imports: [PocketModule, TypeOrmModule.forFeature([PoktPoolUser])],
  controllers: [AdminRoleController],
  providers: [AdminRoleService],
})
export class AdminRoleModule {}
