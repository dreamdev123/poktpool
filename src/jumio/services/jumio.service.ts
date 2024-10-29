import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { JUMIO_DECISION, JUMIO_STATUS } from 'src/constants';
import { Jumio } from 'src/auth/entities/jumio.entity';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { JumioUtilService } from './jumio.util.service';
import { JUMIO_REASON } from './jumio.constants';
import { Repository } from 'typeorm';

@Injectable()
export class JumioService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    @InjectRepository(Jumio)
    private jumioRepository: Repository<Jumio>,
    private readonly configService: ConfigService,
    private readonly jumioUtilService: JumioUtilService,
  ) {}

  getJumioPostData(poktPoolUser: PoktPoolUser) {
    return {
      workflowDefinition: {
        key: 10011,
      },
      customerInternalReference: poktPoolUser.email,
      userReference: poktPoolUser.username,
      callbackUrl: this.configService.get('apiServer') + '/jumio/jumio-update',
    };
  }

  async recreateJumioTransaction(jumioEntry: Jumio, poktPoolUser: PoktPoolUser) {
    const { data: jumioData } = await lastValueFrom(
      this.httpService.put(
        'https://account.amer-1.jumio.ai/api/v1/accounts/' + jumioEntry.accountId,
        this.getJumioPostData(poktPoolUser),
      ),
    );
    jumioEntry.transactionId = jumioData.workflowExecution.id;
    jumioEntry.webHref = jumioData.web.href;
    await this.jumioRepository.save(jumioEntry);
  }

  async getKYCStatus(poktPoolUser: PoktPoolUser) {
    if (poktPoolUser.jumioDecision) {
      return {
        status: JUMIO_STATUS.PROCESSED,
        jumioDecision: poktPoolUser.jumioDecision,
        allowRetry: Boolean(poktPoolUser.jumioAllowRetry),
        reason: poktPoolUser.jumioReason,
      };
    }

    const jumioEntry = await this.jumioRepository.findOne({
      where: {
        userId: poktPoolUser.id,
      },
    });

    // Create a new Jumio account
    if (!jumioEntry) {
      const { data: jumioData } = await lastValueFrom(
        this.httpService.post(
          'https://account.amer-1.jumio.ai/api/v1/accounts',
          this.getJumioPostData(poktPoolUser),
        ),
      );
      const newJumioEntry = this.jumioRepository.create({
        accountId: jumioData.account.id,
        transactionId: jumioData.workflowExecution.id,
        webHref: jumioData.web.href,
        userId: poktPoolUser.id,
      });
      await this.jumioRepository.save(newJumioEntry);
      return {
        status: JUMIO_STATUS.INITIATED,
        webHref: jumioData.web.href,
      };
    }

    // Check Jumio transaction status
    const { data: workflowDetails } = await lastValueFrom(
      this.httpService.get(
        `https://retrieval.amer-1.jumio.ai/api/v1/workflow-executions/${jumioEntry.transactionId}`,
      ),
    );
    if (workflowDetails.workflow.status === JUMIO_STATUS.INITIATED) {
      return {
        status: JUMIO_STATUS.INITIATED,
        webHref: jumioEntry.webHref,
      };
    }
    if (
      workflowDetails.workflow.status === JUMIO_STATUS.ACQUIRED ||
      workflowDetails.workflow.status === JUMIO_STATUS.PROCESSED
    ) {
      return {
        status: JUMIO_STATUS.ACQUIRED,
      };
    }

    // Jumio transaction expired, create a new one
    await this.recreateJumioTransaction(jumioEntry, poktPoolUser);
    return {
      status: JUMIO_STATUS.INITIATED,
      webHref: jumioEntry.webHref,
    };
  }

  async retryKYC(poktPoolUser: PoktPoolUser) {
    if (!poktPoolUser.jumioAllowRetry) {
      throw new BadRequestException('Bad request');
    }

    const jumioEntry = await this.jumioRepository.findOne({
      where: {
        userId: poktPoolUser.id,
      },
    });
    if (!jumioEntry) {
      throw new BadRequestException('Bad request');
    }

    await this.recreateJumioTransaction(jumioEntry, poktPoolUser);

    // reset KYC
    poktPoolUser.jumioDecision = null;
    poktPoolUser.jumioAllowRetry = false;
    poktPoolUser.jumioReason = null;
    await this.poktPoolUsersRepository.save(poktPoolUser);

    return {
      status: JUMIO_STATUS.INITIATED,
      webHref: jumioEntry.webHref,
    };
  }

  async jumioUpdate(payload) {
    const { workflowExecution } = payload;
    if (workflowExecution.status !== JUMIO_STATUS.PROCESSED) {
      return;
    }

    const jumioEntry = await this.jumioRepository.findOne({
      where: {
        transactionId: workflowExecution.id,
      },
    });
    if (!jumioEntry) {
      return;
    }

    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        id: jumioEntry.userId,
      },
    });
    if (poktPoolUser.jumioDecision) {
      return;
    }

    const { data: workflowDetails } = await lastValueFrom(
      this.httpService.get(
        `https://retrieval.amer-1.jumio.ai/api/v1/workflow-executions/${jumioEntry.transactionId}`,
      ),
    );
    if (workflowDetails.decision.type === JUMIO_DECISION.NOT_EXECUTED) {
      return;
    }

    const jumioProfile = await this.jumioUtilService.extractProfile(workflowDetails);
    if (this.jumioUtilService.isPassed(workflowDetails)) {
      poktPoolUser.repeatedFace = this.jumioUtilService.isRepeatedFace(workflowDetails);
      // extract age and country
      if (!jumioProfile) {
        poktPoolUser.jumioDecision = JUMIO_DECISION.MANUAL_REVIEW;
        poktPoolUser.jumioAllowRetry = false;
        poktPoolUser.jumioReason = JUMIO_REASON.NO_INFO;
      }
      // under 18
      else if (this.jumioUtilService.isUnder18(jumioProfile)) {
        poktPoolUser.jumioDecision = JUMIO_DECISION.REJECTED;
        poktPoolUser.jumioAllowRetry = false;
        poktPoolUser.jumioReason = JUMIO_REASON.UNDER_18;
      }
      // sanctioned
      else if (this.jumioUtilService.isFromSanctioned(jumioProfile)) {
        poktPoolUser.jumioDecision = JUMIO_DECISION.MANUAL_REVIEW;
        poktPoolUser.jumioAllowRetry = false;
        poktPoolUser.jumioReason = JUMIO_REASON.SANCTIONED;
      }
      // all good
      else {
        poktPoolUser.jumioDecision = JUMIO_DECISION.PASSED;
        poktPoolUser.jumioAllowRetry = false;
        poktPoolUser.jumioReason = null;
      }
    }
    // rejected or warning
    else {
      poktPoolUser.jumioDecision = workflowDetails.decision.type;
      poktPoolUser.jumioAllowRetry = this.jumioUtilService.getRetryAllowance(workflowDetails);
      poktPoolUser.jumioReason = null;
    }

    // save
    await this.poktPoolUsersRepository.save(poktPoolUser);
    if (jumioProfile) {
      const { dateOfBirthParts, issuingCountry, state, gender } = jumioProfile;
      if (dateOfBirthParts) {
        jumioEntry.ageAtKYC =
          new Date(workflowDetails.completedAt).getUTCFullYear() - Number(dateOfBirthParts.year);
      }
      if (gender) {
        jumioEntry.gender = gender;
      }
      if (issuingCountry) {
        jumioEntry.idLocale = issuingCountry;
      }
      if (issuingCountry === 'USA' && state) {
        jumioEntry.idUsState = state;
      }
      jumioEntry.completedAt = workflowDetails.completedAt;
      await this.jumioRepository.save(jumioEntry);
    }

    // send discord notification
    if (poktPoolUser.jumioDecision === JUMIO_DECISION.MANUAL_REVIEW) {
      await this.jumioUtilService.sendManualReviewNotification(poktPoolUser);
    }
  }
}
