import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { InjectKnex, Knex } from 'nestjs-knex';

@Injectable()
export class JwtTwoFactorGuard extends AuthGuard('jwt-two-factor') {
  constructor(private reflector: Reflector, @InjectKnex() private readonly knex: Knex) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isTwoFactorAuthenticated = await super.canActivate(context);
    if (!isTwoFactorAuthenticated) return false;

    const featureId = this.reflector.getAllAndOverride('admin_feature_id', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!featureId) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const permissions = await this.knex('vw_user_permissions').select('*').where({
      user_id: user.id,
      pool_id: 1,
      feature_id: featureId,
    });
    return permissions.length > 0;
  }
}
