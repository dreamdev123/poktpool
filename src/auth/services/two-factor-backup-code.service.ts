import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { TwoFactorBackupCode } from '../entities/two-factor-backup-code.entity';
import { PoktPoolUser } from '../entities/user.entity';

@Injectable()
export class TwoFactorBackupCodeService {
  static CODE_COUNT = 5;

  constructor(
    @InjectRepository(TwoFactorBackupCode)
    private backupCodeRepository: Repository<TwoFactorBackupCode>,
  ) {}

  public async deleteCodes(poktPoolUser: PoktPoolUser) {
    await this.backupCodeRepository.delete({
      userId: poktPoolUser.id,
    });
  }

  public generateCodes() {
    const codes = [];
    for (let index = 0; index < TwoFactorBackupCodeService.CODE_COUNT; index += 1) {
      codes.push(randomBytes(3).toString('hex'));
    }
    return codes;
  }

  public async verifyBackupCode(backupCode: string, poktPoolUser: PoktPoolUser) {
    const { affected } = await this.backupCodeRepository.delete({
      code: backupCode,
      userId: poktPoolUser.id,
    });
    return affected > 0;
  }
}
