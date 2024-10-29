import { Module } from '@nestjs/common';
import { PocketModule } from 'src/pocket/pocket.module';
import { AirflowController } from './controllers/airflow.controller';
import { AirflowService } from './services/airflow.service';

@Module({
  imports: [PocketModule],
  controllers: [AirflowController],
  providers: [AirflowService],
})
export class AirflowModule {}
