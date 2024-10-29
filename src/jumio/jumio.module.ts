import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { JumioController } from './controllers/jumio.controller';
import { JumioService } from './services/jumio.service';
import { JumioUtilService } from './services/jumio.util.service';
import { Jumio } from 'src/auth/entities/jumio.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        auth: {
          username: configService.get('JUMIO_USERNAME'),
          password: configService.get('JUMIO_PASSWORD'),
        },
        headers: { 'Content-Type': 'application/json' },
      }),
    }),
    TypeOrmModule.forFeature([PoktPoolUser, Jumio]),
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
  controllers: [JumioController],
  providers: [JumioService, JumioUtilService],
  exports: [JumioService, JumioUtilService],
})
export class JumioModule {}
