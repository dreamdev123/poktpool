import { Injectable } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { PocketService } from './pocket.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { TransferStakeDto } from 'src/stake/dto/transfer-stake.dto';
import { CONTACT_CHANNEL, CONTACT_TYPE } from 'src/admin/enums/notification.enum';
import { EmailService } from 'src/email/service/email.service';
import { EMAIL_TEMPLATE } from 'src/constants';
import { WALLET_VERF_REQ } from 'src/types/wallet_verf_req';
import { SWEEP_REQ_HIST, UNSTAKE_DUE } from 'src/admin/admin.types';

@Injectable()
export class NotificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    private readonly emailService: EmailService,
    @InjectKnex() private readonly knex: Knex,
  ) {}

  async sendTransferReceivedEmail(fromCustomer: Customer, transferStakeDto: TransferStakeDto) {
    for (const oneTransfer of transferStakeDto.list) {
      const sendEmail = async () => {
        const targetCustomer = await this.knex('pokt_pool_user')
          .first(['pokt_pool_user.user_id', 'pokt_pool_user.email'])
          .innerJoin('customer', 'customer.user_id', 'pokt_pool_user.user_id')
          .where({
            'customer.customer_id': oneTransfer.to_customer_id,
          });
        const contactPref = await this.knex('contact_prefs').first('*').where({
          user_id: targetCustomer.user_id,
          channel_id: CONTACT_CHANNEL.EMAIL,
          contact_type_id: CONTACT_TYPE.TRANSFER_RECEIVED,
        });
        if (!contactPref) return;

        await this.emailService.sendTemplateEmail({
          to: targetCustomer.email,
          templateId: EMAIL_TEMPLATE.TRANSFER_RECEIVED,
          dynamicTemplateData: {
            senderWalletId: fromCustomer.primaryWalletId,
            poktAmount: oneTransfer.amount,
          },
        });
      };
      try {
        await sendEmail();
      } catch (err) {
        console.log(err);
      }
    }
  }

  async sendWalletVerifiedEmail(wallet: WALLET_VERF_REQ) {
    const targetCustomer = await this.knex('pokt_pool_user').first(['user_id', 'email']).where({
      user_id: wallet.user_id,
    });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.WALLET_VERIFICATION,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.WALLET_VERIFIED,
      dynamicTemplateData: {
        walletInfo: wallet.wallet_nickname || wallet.wallet_address,
      },
    });
  }

  async sendWalletExpiredEmail(wallet: WALLET_VERF_REQ) {
    const targetCustomer = await this.knex('pokt_pool_user').first(['user_id', 'email']).where({
      user_id: wallet.user_id,
    });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.WALLET_VERIFICATION,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.WALLET_EXPIRED,
      dynamicTemplateData: {
        walletInfo: wallet.wallet_nickname || wallet.wallet_address,
      },
    });
  }

  async sendStakingVerifiedEmail(txn) {
    const targetCustomer = await this.knex('pokt_pool_user')
      .first(['pokt_pool_user.user_id', 'pokt_pool_user.email'])
      .innerJoin('customer', 'customer.user_id', 'pokt_pool_user.user_id')
      .where({
        'customer.customer_id': txn.customer_id,
      });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.STAKING_VERIFICATION,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.STAKING_VERIFIED,
      dynamicTemplateData: {
        txHash: txn.network_txn_id,
      },
    });
  }

  async sendStakingFailedEmail(txn: any, reason: string) {
    const targetCustomer = await this.knex('pokt_pool_user')
      .first(['pokt_pool_user.user_id', 'pokt_pool_user.email'])
      .innerJoin('customer', 'customer.user_id', 'pokt_pool_user.user_id')
      .where({
        'customer.customer_id': txn.customer_id,
      });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.STAKING_VERIFICATION,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.STAKING_FAILED,
      dynamicTemplateData: {
        txHash: txn.network_txn_id,
        reasonDesc: reason,
      },
    });
  }

  async sendUnstakeSentEmail(unstake: UNSTAKE_DUE, amount: BigNumber, txHash: string) {
    const targetCustomer = await this.knex('pokt_pool_user')
      .first(['pokt_pool_user.user_id', 'pokt_pool_user.email'])
      .innerJoin('customer', 'customer.user_id', 'pokt_pool_user.user_id')
      .where({
        'customer.p_wallet_id': unstake.recpt_wallet,
      });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.UNSTAKE_SENT,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.UNSTAKE_SENT,
      dynamicTemplateData: {
        txHash,
        poktAmount: amount.div(1e6).toFixed(2),
      },
    });
  }

  async sendSweepSentEmail(sweep: SWEEP_REQ_HIST, amount: BigNumber, txHash: string) {
    const targetCustomer = await this.knex('pokt_pool_user')
      .first(['pokt_pool_user.user_id', 'pokt_pool_user.email'])
      .innerJoin('customer', 'customer.user_id', 'pokt_pool_user.user_id')
      .where({
        'customer.p_wallet_id': sweep.to_wallet,
      });
    const contactPref = await this.knex('contact_prefs').first('*').where({
      user_id: targetCustomer.user_id,
      channel_id: CONTACT_CHANNEL.EMAIL,
      contact_type_id: CONTACT_TYPE.SWEEP_SENT,
    });
    if (!contactPref) return;

    await this.emailService.sendTemplateEmail({
      to: targetCustomer.email,
      templateId: EMAIL_TEMPLATE.SWEEP_SENT,
      dynamicTemplateData: {
        txHash,
        poktAmount: amount.div(1e6).toFixed(2),
      },
    });
  }

  async sendMonthlyStatement() {
    const users = await this.knex('contact_prefs')
      .innerJoin('pokt_pool_user', 'pokt_pool_user.user_id', 'contact_prefs.user_id')
      .select('pokt_pool_user.email')
      .where({
        'pokt_pool_user.is_email_verified': true,
        'contact_prefs.channel_id': CONTACT_CHANNEL.EMAIL,
        'contact_prefs.contact_type_id': CONTACT_TYPE.MONTHLY_STATEMENT,
      });
    const emails = users.map((user) => user.email);
    const LIMIT = 900;

    for (let index = 0; index < Math.ceil(emails.length / LIMIT); index += 1) {
      const emailsChunk = emails.slice(index * LIMIT, (index + 1) * LIMIT);
      await this.emailService.sendBulkTemplateEmail({
        emails: emailsChunk,
        templateId: EMAIL_TEMPLATE.MONTHLY_STATEMENT,
        dynamicTemplateData: {},
      });
    }
  }
}
