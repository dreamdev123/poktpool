import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { authenticator } from 'otplib';
import { TwoFactorBackupCodeService } from './two-factor-backup-code.service';
import { PoktPoolUser } from '../entities/user.entity';
import { TwoFactorBackupCode } from '../entities/two-factor-backup-code.entity';
import { Response } from 'express';
import { toFileStream } from 'qrcode';
import { Repository } from 'typeorm';
import { TwoFactorAuthDto } from '../dto/two-factor-auth.dto';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    private twoFactorBackupCodeService: TwoFactorBackupCodeService,
    private configService: ConfigService,
    private dataSource: DataSource,
    @InjectKnex() private readonly knex: Knex,
  ) {}

  public async generateTwoFactorSecret(poktPoolUser: PoktPoolUser) {
    if (poktPoolUser.isTwoFactorEnabled) {
      return {
        msg: 'QR already generated',
      };
    }

    const secret = authenticator.generateSecret();
    const twoFaAppName = this.configService.get('TWO_FACTOR_AUTHENTICATION_APP_NAME');
    const otpassAuthUrl = authenticator.keyuri(poktPoolUser.username, twoFaAppName, secret);

    await this.poktPoolUsersRepository.update(
      { username: poktPoolUser.username },
      { twoFactorSecret: secret },
    );
    return {
      secret,
      otpassAuthUrl,
    };
  }

  public async qrCodeStreamPipe(stream: Response, otpassAuthUrl: string) {
    return toFileStream(stream, otpassAuthUrl);
  }

  public async enableTwoFactorAuth(poktPoolUser: PoktPoolUser) {
    const codes = this.twoFactorBackupCodeService.generateCodes();

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TwoFactorBackupCode, {
        userId: poktPoolUser.id,
      });
      for (const code of codes) {
        await manager.save(TwoFactorBackupCode, {
          code,
          userId: poktPoolUser.id,
        });
      }
      await manager.update(PoktPoolUser, { id: poktPoolUser.id }, { isTwoFactorEnabled: true });
    });

    return codes;
  }

  public async disableTwoFactorAuth(poktPoolUser: PoktPoolUser) {
    await this.dataSource.transaction(async (manager) => {
      await manager.delete(TwoFactorBackupCode, {
        userId: poktPoolUser.id,
      });
      await manager.update(PoktPoolUser, { id: poktPoolUser.id }, { isTwoFactorEnabled: false });
    });
  }

  public verifyTwoFactorCode(twoFactorCode: string, poktPoolUser: PoktPoolUser) {
    return authenticator.verify({
      token: twoFactorCode,
      secret: poktPoolUser.twoFactorSecret,
    });
  }

  public async checkTwoFactorAuthDto(twoFactorAuthDto: TwoFactorAuthDto, poktPoolUser: PoktPoolUser) {
    if (twoFactorAuthDto.twoFactorCode) {
      const isValid = this.verifyTwoFactorCode(twoFactorAuthDto.twoFactorCode, poktPoolUser);
      if (!isValid) {
        throw new BadRequestException('You have provided an invalid authentication code');
      }
      return;
    }
    if (twoFactorAuthDto.backupCode) {
      const isValid = await this.twoFactorBackupCodeService.verifyBackupCode(
        twoFactorAuthDto.backupCode,
        poktPoolUser,
      );
      if (!isValid) {
        throw new BadRequestException('You have provided an invalid backup code');
      }
      return;
    }
    throw new BadRequestException('You must provider either 2FA code or backup code');
  }
}
