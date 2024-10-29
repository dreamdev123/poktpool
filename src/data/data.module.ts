import { Module } from '@nestjs/common';
import { DataController } from './controllers/data.controller';
import { DataService } from './services/data.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DataController],
  providers: [DataService],
})
export class DataModule {}
