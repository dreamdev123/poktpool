import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtPayload } from '../interfaces/jwtpayload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET'),
      // passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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

    return poktPoolUser;
  }
}
