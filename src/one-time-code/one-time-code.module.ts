import { Module } from '@nestjs/common';
import { OneTimeCodeService } from './services/one-time-code.service';

@Module({
  imports: [],
  providers: [OneTimeCodeService],
  exports: [OneTimeCodeService],
})
export class OneTimeCodeModule {}
