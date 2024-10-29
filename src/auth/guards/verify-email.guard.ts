import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PoktPoolUser } from 'src/auth/entities/user.entity';

@Injectable()
export class VerifyEmailGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest();
    const user: PoktPoolUser = request.user;
    if (!user?.isEmailVerified) {
      throw new ForbiddenException('You need to verify your email');
    }
    return true;
  }
}
