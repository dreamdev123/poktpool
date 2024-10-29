import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KnexModule } from 'nestjs-knex';
import { ConnectionName } from './enums/connection.enum';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('PP_DB_HOST'),
        port: configService.get('PP_DB_PORT'),
        username: configService.get('PP_DB_USERNAME'),
        password: configService.get('PP_DB_PASSWORD'),
        database: configService.get('PP_DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: true,
        logging: false,
        migrations: [__dirname + '/migration/**/*.js'],
        cli: {
          migrationsDir: 'src/database/migration',
        },
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    KnexModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          client: 'pg',
          connection: {
            host: configService.get('PP_DB_HOST'),
            port: configService.get('PP_DB_PORT'),
            user: configService.get('PP_DB_USERNAME'),
            password: configService.get('PP_DB_PASSWORD'),
            database: configService.get('PP_DB_DATABASE'),
            ssl: {
              rejectUnauthorized: false,
            },
          },
        },
      }),
    }),
    KnexModule.forRootAsync(
      {
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          config: {
            client: 'pg',
            connection: {
              host: configService.get('NODE_DB_HOST'),
              port: configService.get('NODE_DB_PORT'),
              user: configService.get('NODE_DB_USERNAME'),
              password: configService.get('NODE_DB_PASSWORD'),
              database: configService.get('NODE_DB_DATABASE'),
              ssl: {
                rejectUnauthorized: false,
              },
            },
          },
        }),
      },
      ConnectionName.NODE,
    ),
  ],
})
export class DatabaseModule {}
