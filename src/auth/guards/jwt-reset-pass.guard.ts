import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtResetPassGuard extends AuthGuard('jwt-reset-password') {}
