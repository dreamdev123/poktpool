import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PoktPoolUser } from '../entities/user.entity';

export const GetPoktPoolUser = createParamDecorator((data: unknown, ctx: ExecutionContext): PoktPoolUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
