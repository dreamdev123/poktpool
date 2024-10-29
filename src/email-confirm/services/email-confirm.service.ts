import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/service/email.service';
import { UsersService } from 'src/users/services/user.service';
import ConfirmChangeEmailDto from '../dto/confirm-change-email.dto';
import EmailChangeJWTPayload from '../interfaces/email-change-jwt-payload.interface';
import VerificationTokenPayload from '../interfaces/verify-token-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import * as sgMail from '@sendgrid/mail';
import { EMAIL_TEMPLATE } from 'src/constants';

@Injectable()
export class EmailConfirmService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
  ) {}

  public async sendVerifyLink(poktPoolUser: PoktPoolUser) {
    const { firstName, email } = poktPoolUser;

    const payload: VerificationTokenPayload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_EXPIRY')}s`,
    });
    const url = `${this.configService.get('frontend')}/confirm-email?token=${token}`;

    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    await sgMail.send({
      to: email,
      from: this.configService.get('fromEmail'),
      templateId: EMAIL_TEMPLATE.EMAIL_VERIFICATION,
      dynamicTemplateData: {
        firstName,
        url,
      },
    });
  }

  public async confirmEmail(email: string) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email,
      },
    });
    if (!poktPoolUser) {
      throw new NotFoundException('Email not Found');
    }
    if (poktPoolUser.isEmailVerified) {
      throw new BadRequestException('Email is already confirmed');
    }

    poktPoolUser.isEmailVerified = true;
    await this.poktPoolUsersRepository.save(poktPoolUser);
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_SECRET'),
      });
      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException();
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token has expired');
      }
      throw new BadRequestException('Invalid confirmation token');
    }
  }

  public async resendEmailConfirmation(email: string) {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email,
      },
    });
    if (!poktPoolUser) {
      throw new NotFoundException('Email not Found');
    }
    if (poktPoolUser.isEmailVerified) {
      throw new BadRequestException('Your Email is Already Confirmed');
    }
    await this.sendVerifyLink(poktPoolUser);
  }

  async confirmChangeEmail(confirmChangeEmailDto: ConfirmChangeEmailDto) {
    try {
      const payload: EmailChangeJWTPayload = await this.jwtService.verify(confirmChangeEmailDto.token, {
        secret: this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_SECRET'),
      });
      const poktPoolUser = await this.poktPoolUsersRepository.findOne({ where: { id: payload.userId } });
      poktPoolUser.email = payload.email;
      poktPoolUser.isEmailVerified = true;
      await this.poktPoolUsersRepository.save(poktPoolUser);
    } catch (error) {
      throw new BadRequestException('Invalid confirmation token');
    }
  }
}
