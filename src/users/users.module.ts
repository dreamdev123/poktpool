import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/user.service';
import { MulterModule } from '@nestjs/platform-express';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { CustomerModule } from 'src/customer/customer.module';
import { PocketModule } from 'src/pocket/pocket.module';
import { PromoCodeService } from './services/promo-code.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      dest: './uploads',
    }),
    TypeOrmModule.forFeature([PoktPoolUser, Customer]),
    CustomerModule,
    PocketModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PromoCodeService],
  exports: [UsersService],
})
export class UsersModule {}
