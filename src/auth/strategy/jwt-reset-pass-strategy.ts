import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import VerificationForgotPayload from '../interfaces/verify-forgot-payload.interface';

@Injectable()
export class JwtResetPassStrategy extends PassportStrategy(Strategy, 'jwt-reset-password') {
  constructor(
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_PASSWORD_RESET_TOKEN_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }
  async validate(payload: VerificationForgotPayload): Promise<PoktPoolUser> {
    const { forgotPasswordDto, createdTimestamp } = payload;
    const poktPoolUser: PoktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        email: forgotPasswordDto.email,
      },
    });
    if (!poktPoolUser) {
      throw new BadRequestException();
    }
    if (createdTimestamp < poktPoolUser.passwordUpdatedTimestamp) {
      throw new BadRequestException();
    }

    return poktPoolUser;
  }
}
