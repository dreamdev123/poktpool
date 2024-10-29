import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { authenticator } from 'otplib';
import { InjectKnex, Knex } from 'nestjs-knex';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { EMAIL_TEMPLATE, TXN_TYPE_CODE } from 'src/constants';

@Injectable()
export class OneTimeCodeService {
  constructor(private readonly configService: ConfigService, @InjectKnex() private readonly knex: Knex) {}

  private randomDigits() {
    return Math.floor(100000 + Math.random() * 900000).toFixed(0);
  }

  async sendCode(poktPoolUser: PoktPoolUser, txn_type_code: TXN_TYPE_CODE) {
    if (poktPoolUser.isTwoFactorEnabled) {
      throw new BadRequestException('2FA enabled');
    }
    await this.knex('single_use_code').delete().where({
      user_id: poktPoolUser.id,
      txn_type_code,
    });

    const code_digits = this.randomDigits();
    await this.knex('single_use_code').insert({
      user_id: poktPoolUser.id,
      txn_type_code,
      code_digits,
      exp_timestamp: new Date(Date.now() + 3600 * 1000).toISOString(),
    });

    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    await sgMail.send({
      to: poktPoolUser.email,
      from: this.configService.get('fromEmail'),
      templateId: EMAIL_TEMPLATE.ONE_TIME_CODE,
      dynamicTemplateData: {
        username: poktPoolUser.username,
        otp_code: code_digits,
        request_type: txn_type_code === TXN_TYPE_CODE.TRANSFER ? 'transfer' : 'unstake',
      },
    });
  }

  async checkCode(poktPoolUser: PoktPoolUser, txn_type_code: TXN_TYPE_CODE, { twoFactorCode, oneTimeCode }) {
    if (poktPoolUser.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        throw new BadRequestException('Wrong code');
      }
      const isValid = authenticator.verify({
        token: twoFactorCode,
        secret: poktPoolUser.twoFactorSecret,
      });
      if (!isValid) {
        throw new BadRequestException('Wrong code');
      }
      return true;
    }

    if (!oneTimeCode) {
      throw new BadRequestException('Wrong code');
    }
    const record = await this.knex('single_use_code')
      .first('*')
      .where({
        user_id: poktPoolUser.id,
        txn_type_code,
        code_digits: oneTimeCode,
      })
      .where('exp_timestamp', '>', new Date().toISOString());
    if (!record) {
      throw new BadRequestException('Wrong code');
    }

    await this.knex('single_use_code').delete().where({
      user_id: poktPoolUser.id,
      txn_type_code,
    });
    return true;
  }
}
