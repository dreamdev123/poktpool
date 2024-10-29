import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { UserSignupDto } from 'src/auth/dto/user-signup.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../interfaces/jwtpayload.interface';
import { ConfigService } from '@nestjs/config';
import { PoktPoolUser } from '../entities/user.entity';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { EmailService } from 'src/email/service/email.service';
import VerificationForgotPayload from '../interfaces/verify-forgot-payload.interface';
import { UserMatchSignupDto } from '../dto/user-match-signup.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Repository } from 'typeorm';
import { PgErrorCode } from 'src/database/enums/pgErrorCodes.enum';
import { Customer } from '../entities/customer.entity';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { TwoFactorAuthService } from './two-factor-auth.service';
import * as sgMail from '@sendgrid/mail';
import { EMAIL_TEMPLATE } from 'src/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly emailService: EmailService,
    @InjectKnex() private readonly knex: Knex,
  ) {}

  async signUp(userSignupDto: UserSignupDto): Promise<PoktPoolUser> {
    const { username, password, firstName, lastName, email } = userSignupDto;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
      const poktPoolUser = this.poktPoolUsersRepository.create({
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
      });

      await this.poktPoolUsersRepository.save(poktPoolUser);

      return poktPoolUser;
    } catch (error) {
      if (error?.code === PgErrorCode.UniqueViolation) {
        throw new ConflictException(
          'The username, email, or wallet id you provided already exists. Please try again with different values.',
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async matchUser(userMatchSignupDto: UserMatchSignupDto): Promise<PoktPoolUser> {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: userMatchSignupDto.email,
      },
    });
    if (!poktPoolUser) {
      throw new NotFoundException('Something does not match');
    }
    if (poktPoolUser.username) {
      throw new NotFoundException('Something does not match');
    }

    const customer = await this.customerRepository.findOne({
      where: {
        userId: poktPoolUser.id,
      },
    });
    if (customer.primaryWalletId !== userMatchSignupDto.primaryWalletId) {
      throw new NotFoundException('Something does not match');
    }

    const { username, password, firstName, lastName } = userMatchSignupDto;
    const salt = await bcrypt.genSalt(10);
    poktPoolUser.username = username;
    poktPoolUser.password = await bcrypt.hash(password, salt);
    poktPoolUser.firstName = firstName;
    poktPoolUser.lastName = lastName;

    try {
      await this.poktPoolUsersRepository.save(poktPoolUser);
      return poktPoolUser;
    } catch (error) {
      if (error?.code === PgErrorCode.UniqueViolation) {
        throw new ConflictException(
          'The username, email, or wallet id you provided already exists. Please try again with different values.',
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{
    accessToken: string;
    refreshToken?: string;
    poktPoolUser?: JwtPayload;
    isTwoFactorEnabled?: boolean;
    permissions?: any;
  }> {
    const { username, password } = authCredentialsDto;
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({ where: { username } });
    if (!poktPoolUser) {
      throw new BadRequestException('Login failed');
    }
    const isPasswordValid = await bcrypt.compare(password, poktPoolUser.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Login failed');
    }
    if (poktPoolUser.isTwoFactorEnabled) {
      try {
        await this.twoFactorAuthService.checkTwoFactorAuthDto(
          { twoFactorCode: authCredentialsDto.twoFactorCode },
          poktPoolUser,
        );
      } catch (err) {
        throw new BadRequestException('Login failed');
      }
    }

    const payload: JwtPayload = {
      isTwoFactorAuthenticated: true,
      isTwoFactorEnabled: poktPoolUser.isTwoFactorEnabled,
      isEmailVerified: poktPoolUser.isEmailVerified,
      jumioDecision: poktPoolUser.jumioDecision,
      username: poktPoolUser.username,
      email: poktPoolUser.email,
      id: poktPoolUser.id,
    };
    const permissions = await this.knex('vw_user_permissions').select('feature_id').where({
      user_id: poktPoolUser.id,
      pool_id: 1,
    });
    const accessToken: string = await this.getAccessToken(payload);
    const refreshToken: string = await this.getRefreshToken(payload);
    await this.updateUserRefreshToken(refreshToken, poktPoolUser.username);
    await this.poktPoolUsersRepository.update(
      { id: poktPoolUser.id },
      { lastLoginTs: new Date().toISOString() },
    );
    return {
      accessToken,
      refreshToken,
      permissions: permissions.map(({ feature_id }) => feature_id),
      poktPoolUser: payload,
    };
  }

  async signOut(poktPoolUser: PoktPoolUser) {
    await this.updateUserRefreshToken(null, poktPoolUser.username);
  }

  async updateUserRefreshToken(refreshToken: string, username: string) {
    const hashedRefreshToken = refreshToken ? await bcrypt.hash(refreshToken, 10) : null;
    await this.poktPoolUsersRepository.update({ username: username }, { hashedRefreshToken });
  }

  async getAccessToken(payload: JwtPayload) {
    const accessToken = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('accessTokenExpiration'),
    });
    return accessToken;
  }

  async getRefreshToken(payload: JwtPayload) {
    const refreshToken = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('refreshTokenExpiration'),
    });
    return refreshToken;
  }

  async getNewAccessRefreshToken(poktPoolUser: PoktPoolUser, refreshTokenDto: RefreshTokenDto) {
    const isRefreshMatching = await bcrypt.compare(
      refreshTokenDto.refreshToken,
      poktPoolUser.hashedRefreshToken,
    );
    if (!isRefreshMatching) {
      throw new UnauthorizedException();
    }

    const payload: JwtPayload = {
      isTwoFactorAuthenticated: poktPoolUser.isTwoFactorEnabled,
      isTwoFactorEnabled: poktPoolUser.isTwoFactorEnabled,
      username: poktPoolUser.username,
      email: poktPoolUser.email,
      id: poktPoolUser.id,
    };
    const accessToken = await this.getAccessToken(payload);
    const refreshToken = await this.getRefreshToken(payload);

    await this.updateUserRefreshToken(refreshToken, poktPoolUser.username);

    return {
      accessToken,
      refreshToken,
    };
  }

  async changePassword(poktPoolUser: PoktPoolUser, changePasswordDto: ChangePasswordDto) {
    if (poktPoolUser.email !== changePasswordDto.email) {
      throw new BadRequestException('Wrong email address');
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.password, poktPoolUser.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Wrong password');
    }

    const salt = await bcrypt.genSalt(10);
    poktPoolUser.password = await bcrypt.hash(changePasswordDto.newPassword, salt);
    poktPoolUser.passwordUpdatedTimestamp = Date.now();
    await this.poktPoolUsersRepository.save(poktPoolUser);

    return { message: 'Password Successfully Updated' };
  }

  public async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_PASSWORD_RESET_TOKEN_SECRET'),
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

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const poktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: forgotPasswordDto.email,
      },
    });
    if (!poktPoolUser) {
      return;
    }
    // if (poktPoolUser.isEmailVerified !== true) {
    //   return;
    // }

    const payload: VerificationForgotPayload = {
      forgotPasswordDto,
      createdTimestamp: Date.now(),
    };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_PASSWORD_RESET_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_PASSWORD_RESET_TOKEN_EXPIRY')}s`,
    });
    const emailUrl = `${this.configService.get('frontend')}/reset-password?token=${token}`;

    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    await sgMail.send({
      to: poktPoolUser.email,
      from: this.configService.get('fromEmail'),
      templateId: EMAIL_TEMPLATE.FORGOT_PASSWORD,
      dynamicTemplateData: {
        username: poktPoolUser.username,
        url: emailUrl,
      },
    });
  }

  async resetPassword(poktPoolUser: PoktPoolUser, resetPasswordDto: ResetPasswordDto) {
    const salt = await bcrypt.genSalt(10);
    poktPoolUser.password = await bcrypt.hash(resetPasswordDto.password, salt);
    poktPoolUser.passwordUpdatedTimestamp = Date.now();
    poktPoolUser.isEmailVerified = true;
    await this.poktPoolUsersRepository.save(poktPoolUser);

    return { message: 'Password Successfully Updated' };
  }
}
