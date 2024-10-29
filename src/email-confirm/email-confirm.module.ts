import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { EmailModule } from 'src/email/email.module';
import { UsersModule } from 'src/users/users.module';
import { EmailConfirmController } from './controller/email-confirm.controller';
import { EmailConfirmService } from './services/email-confirm.service';

@Module({
  imports: [
    ConfigModule,
    EmailModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([PoktPoolUser, Customer]),
    UsersModule,
  ],
  controllers: [EmailConfirmController],
  exports: [EmailConfirmService],
  providers: [EmailConfirmService],
})
export class EmailConfirmModule {}
