import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Customer } from 'src/auth/entities/customer.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { PocketService } from './services/pocket.service';
import { AdminUtilService } from './services/admin.util.service';
import { BuyUtilService } from './services/buy.util.service';
import { CustomerUtilService } from './services/customer.util.service';
import { EmailModule } from 'src/email/email.module';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    EmailModule,
    TypeOrmModule.forFeature([PoktPoolUser, Customer]),
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.get('DISCORD_BOT_TOKEN'),
        discordClientOptions: {
          intents: [GatewayIntentBits.Guilds],
        },
      }),
    }),
  ],
  providers: [PocketService, AdminUtilService, BuyUtilService, CustomerUtilService, NotificationService],
  exports: [PocketService, AdminUtilService, BuyUtilService, CustomerUtilService, NotificationService],
})
export class PocketModule {}
