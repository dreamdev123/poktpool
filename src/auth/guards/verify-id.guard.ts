import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { JUMIO_DECISION } from 'src/constants';

@Injectable()
export class VerifyIDGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest();
    const user: PoktPoolUser = request.user;
    if (!user?.isEmailVerified) {
      throw new ForbiddenException('You need to verify your email');
    }
    if (user.jumioDecision !== JUMIO_DECISION.PASSED) {
      throw new ForbiddenException('You need to verify identity');
    }
    return true;
  }
}
