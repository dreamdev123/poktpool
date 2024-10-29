import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminSegmentController } from './controllers/admin.segment.controller';
import { AdminSegmentService } from './services/admin.segment.service';
import { PocketModule } from 'src/pocket/pocket.module';

@Module({
  imports: [PocketModule, TypeOrmModule.forFeature([PoktPoolUser])],
  controllers: [AdminSegmentController],
  providers: [AdminSegmentService],
})
export class AdminSegmentModule {}
