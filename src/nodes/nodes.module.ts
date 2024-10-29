import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NodesController } from './controllers/nodes.controller';
import { NodesService } from './services/nodes.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminModule } from 'src/admin/admin.module';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PoktPoolUser, Customer]), AdminModule],
  controllers: [NodesController],
  providers: [NodesService],
})
export class NodesModule {}
