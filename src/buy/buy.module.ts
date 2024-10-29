import { Module } from '@nestjs/common';
import { BuyController } from './controllers/buy.controller';
import { BuyService } from './services/buy.service';
import { PocketModule } from 'src/pocket/pocket.module';

@Module({
  imports: [PocketModule],
  controllers: [BuyController],
  providers: [BuyService],
})
export class BuyModule {}
