import { Body, Controller, Ip, HttpCode, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserSignupDto } from 'src/auth/dto/user-signup.dto';
import { AuthService } from '../services/auth.service';
import { GetPoktPoolUser } from '../decorator/get-user.decorator';
import { AuthCredentialsDto } from '../dto/auth-credentials.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtRefreshGuard } from '../guards/jwt-refresh-token.guard';
import { JwtTwoFactorGuard } from '../guards/jwt-two-factor.guard';
import { JwtResetPassGuard } from '../guards/jwt-reset-pass.guard';
import { PoktPoolUser } from '../entities/user.entity';
import { EmailConfirmService } from '../../email-confirm/services/email-confirm.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UserMatchSignupDto } from '../dto/user-match-signup.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { Throttle } from '@nestjs/throttler';
import { Recaptcha } from '@nestlab/google-recaptcha';

@ApiTags('PoktPool Auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ transform: true }))
export class AuthController {
  constructor(private authService: AuthService, private emailConfirmService: EmailConfirmService) {}

  @Recaptcha()
  @Post('/signup-recaptcha')
  async signUpRecaptcha(@Body() userSignupDto: UserSignupDto): Promise<{ message: string }> {
    const poktPoolUser = await this.authService.signUp(userSignupDto);
    await this.emailConfirmService.sendVerifyLink(poktPoolUser);

    return { message: 'User created successfully!' };
  }

  @HttpCode(200)
  @Post('/match-user')
  async matchExistingPoktPoolUser(
    @Body(new ValidationPipe({ transform: true }))
    userMatchSignupDto: UserMatchSignupDto,
  ): Promise<{ message: string }> {
    const poktPoolUser = await this.authService.matchUser(userMatchSignupDto);
    await this.emailConfirmService.sendVerifyLink(poktPoolUser);

    return { message: `${poktPoolUser.email} updated successfully` };
  }

  @Recaptcha()
  @Post('/signin-recaptcha')
  signInRecaptcha(@Body() authCredentialsDto: AuthCredentialsDto) {
    return this.authService.signIn(authCredentialsDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtTwoFactorGuard)
  @Post('/signout')
  signOut(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    this.authService.signOut(poktPoolUser);
  }

  @Throttle(5, 5)
  @Post('/forgot-password')
  async forgotPassword(@Body(new ValidationPipe()) forgotPassword: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(forgotPassword);
  }

  @ApiBearerAuth()
  @Throttle(5, 5)
  @Post('/reset-password')
  @UseGuards(JwtResetPassGuard)
  async resetPassword(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body(new ValidationPipe()) resetPassword: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(poktPoolUser, resetPassword);
  }

  @ApiBearerAuth()
  @Throttle(5, 5)
  @Post('/change-password')
  @UseGuards(JwtTwoFactorGuard)
  async changePassword(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body(new ValidationPipe()) changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(poktPoolUser, changePasswordDto);
    return { message: 'You have successfully changed your password' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @Post('/refresh-token')
  async refreshToken(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.getNewAccessRefreshToken(poktPoolUser, refreshTokenDto);
  }

  @Post('/throttle-test')
  async throttleTest(@Ip() ip) {
    return { ip };
  }
}
