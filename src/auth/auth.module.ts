import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './strategy/jwt-refresh-strategy';
import { JwtTwoFactorStrategy } from './strategy/jwt-2fa-strategy';
import { TwoFactorAuth } from './controllers/two-factor-auth.controller';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { EmailConfirmModule } from 'src/email-confirm/email-confirm.module';
import { UsersModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';
import { JwtResetPassStrategy } from './strategy/jwt-reset-pass-strategy';
import { TwoFactorBackupCodeService } from './services/two-factor-backup-code.service';
import { PoktPoolUser } from './entities/user.entity';
import { TwoFactorBackupCode } from './entities/two-factor-backup-code.entity';
import { Jumio } from './entities/jumio.entity';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    EmailConfirmModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([PoktPoolUser, Jumio, TwoFactorBackupCode, Customer]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtTwoFactorStrategy,
    JwtResetPassStrategy,
    TwoFactorAuthService,
    TwoFactorBackupCodeService,
  ],
  controllers: [AuthController, TwoFactorAuth],
  exports: [JwtStrategy, JwtRefreshStrategy, JwtTwoFactorStrategy, PassportModule],
})
export class AuthModule {}
