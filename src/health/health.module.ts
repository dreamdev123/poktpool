import { CacheModule, Module } from '@nestjs/common';
import HealthController from './controller/health.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, CacheModule.register()],
  controllers: [HealthController],
})
export default class HealthModule {}
