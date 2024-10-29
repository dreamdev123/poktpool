import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { StakeModule } from './stake/stake.module';
import { WithdrawModule } from './withdraw/withdraw.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationConfigSchema } from './config/config.schema';
import sharedConfig from './config/shared.config';
import devConfig from './config/dev.config';
import preprodConfig from './config/pre-prod.config';
import prodConfig from './config/prod.config';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailConfirmModule } from './email-confirm/email-confirm.module';
import LoggingMiddleware from './utils/logging.middleware';
import { DatabaseModule } from './database/database-connection.module';
import HealthModule from './health/health.module';
import { NodesModule } from './nodes/nodes.module';
import { AdminModule } from './admin/admin.module';
import { TaskModule } from './task/task.module';
import { JumioModule } from './jumio/jumio.module';
import { ProfileModule } from './profile/profile.module';
import { CustomerModule } from './customer/customer.module';
import { WalletModule } from './wallet/wallet.module';
import { BuyModule } from './buy/buy.module';
import { AdminSellModule } from './admin-sell/admin.sell.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';
import { AdminSegmentModule } from './admin-segment/admin.segment.module';
import { AdminBonusModule } from './admin-bonus/admin.bonus.module';
import { AdminPricingModelModule } from './admin-pricingmodel/admin.pricingmodel.module';
import { AirflowModule } from './airflow/airflow.module';
import { AdminRoleModule } from './admin-role/admin.role.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [sharedConfig, devConfig, preprodConfig, prodConfig],
      validationSchema: validationConfigSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    GoogleRecaptchaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        skipIf: Boolean(configService.get('SKIP_GOOGLE_RECAPTCHA')),
        secretKey: configService.get('GOOGLE_RECAPTCHA_SECRET_KEY'),
        response: (req) => req.headers.recaptcha,
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    DataModule,
    WithdrawModule,
    UsersModule,
    StakeModule,
    AuthModule,
    EmailModule,
    EmailConfirmModule,
    HealthModule,
    NodesModule,
    AdminModule,
    AdminSellModule,
    AdminSegmentModule,
    AdminBonusModule,
    AdminPricingModelModule,
    AdminRoleModule,
    TaskModule,
    JumioModule,
    ProfileModule,
    CustomerModule,
    WalletModule,
    BuyModule,
    AirflowModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 2000,
    }),

    // CacheModule.registerAsync({
    //   useFactory: () => ({
    //     ttl: 5,
    //   }),
    // }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class PoktPoolModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
