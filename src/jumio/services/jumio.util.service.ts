import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as DiscordClient } from 'discord.js';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { TextChannel } from 'discord.js';
import allowList from './jumio.allow.list';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { JUMIO_DECISION, STAGE } from 'src/constants';

@Injectable()
export class JumioUtilService {
  constructor(
    @InjectDiscordClient()
    private readonly discordClient: DiscordClient,
    private readonly configService: ConfigService,
  ) {}

  kycChannel: TextChannel = null;

  @Once('ready')
  onReady() {
    this.kycChannel = this.discordClient.channels.cache.get(
      this.configService.get('kycChannel'),
    ) as TextChannel;
  }

  async sendManualReviewNotification(poktPoolUser: PoktPoolUser) {
    if (this.configService.get('STAGE') !== STAGE.PROD) {
      return;
    }

    try {
      await this.kycChannel.send(
        `Manual review required!\n\`${poktPoolUser.username}\`\n${poktPoolUser.email}`,
      );
    } catch (err) {
      console.log(err);
    }
  }

  async extractProfile(workflowDetails) {
    try {
      const { capabilities } = workflowDetails;
      const data = capabilities.extraction[0].data;

      if (!data.dateOfBirthParts && data.dateOfBirth) {
        data.dateOfBirthParts = {
          year: data.dateOfBirth.split('-')[0],
          month: data.dateOfBirth.split('-')[1],
          day: data.dateOfBirth.split('-')[2],
        };
      }

      const { dateOfBirthParts, issuingCountry, state, gender } = data;
      if (!dateOfBirthParts || !issuingCountry) {
        return null;
      }
      return { dateOfBirthParts, issuingCountry, state, gender };
    } catch (err) {
      return null;
    }
  }

  isUnder18(profile) {
    return new Date().getUTCFullYear() - Number(profile.dateOfBirthParts.year) < 18;
  }

  isFromSanctioned(profile) {
    const list = ['CUB', 'IRN', 'PRK', 'SYR', 'RUS', 'BLR'];
    return list.includes(profile.issuingCountry);
  }

  getRetryAllowance(workflowDetails) {
    const { capabilities } = workflowDetails;

    for (const key of Object.keys(capabilities)) {
      if (!allowList[key]) {
        return false;
      }
      for (const detail of capabilities[key]) {
        const isAllowed = allowList[key].find(
          (allow) =>
            allow.type === detail.decision.type && allow.labels.includes(detail.decision.details.label),
        );
        if (!isAllowed) {
          return false;
        }
      }
    }

    return true;
  }

  isPassed(workflowDetails): boolean {
    if (workflowDetails.decision.type === JUMIO_DECISION.PASSED) {
      return true;
    }

    const { capabilities } = workflowDetails;
    for (const key of Object.keys(capabilities)) {
      for (const detail of capabilities[key]) {
        const isPassed =
          detail.decision.type === JUMIO_DECISION.PASSED ||
          (key === 'imageChecks' &&
            detail.decision.type === JUMIO_DECISION.WARNING &&
            detail.decision.details.label === 'REPEATED_FACE');
        if (!isPassed) return false;
      }
    }

    return true;
  }

  isRepeatedFace(workflowDetails): boolean {
    const { capabilities } = workflowDetails;
    const { imageChecks } = capabilities;

    for (const detail of imageChecks) {
      if (detail.decision.details?.label === 'REPEATED_FACE') {
        return true;
      }
    }

    return false;
  }
}
