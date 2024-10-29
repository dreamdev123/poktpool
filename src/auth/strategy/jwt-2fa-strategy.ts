import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwtpayload.interface';
import { PoktPoolUser } from '../entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtTwoFactorStrategy extends PassportStrategy(Strategy, 'jwt-two-factor') {
  constructor(
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
    });
  }
  async validate(payload: JwtPayload): Promise<PoktPoolUser> {
    const { id } = payload;
    if (!id) {
      throw new UnauthorizedException();
    }

    const poktPoolUser: PoktPoolUser = await this.poktPoolUsersRepository.findOne({
      where: {
        id,
      },
    });
    if (!poktPoolUser) {
      throw new UnauthorizedException();
    }

    if (!poktPoolUser.isTwoFactorEnabled) {
      return poktPoolUser;
    }

    if (payload.isTwoFactorAuthenticated) {
      return poktPoolUser;
    }

    throw new UnauthorizedException();
  }
}
