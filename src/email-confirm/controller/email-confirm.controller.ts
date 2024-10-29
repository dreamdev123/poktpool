import { Body, Controller, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import ConfirmChangeEmailDto from '../dto/confirm-change-email.dto';
import ConfirmEmailDto from '../dto/confirm-email.dto';
import { EmailConfirmService } from '../services/email-confirm.service';

@ApiTags('PoktPool email confirm')
@Controller('confirm-email')
@UsePipes(new ValidationPipe({ transform: true }))
export class EmailConfirmController {
  constructor(private readonly emailConfirmService: EmailConfirmService) {}

  @Post('/confirm')
  async confirm(@Body() confirmData: ConfirmEmailDto) {
    const email = await this.emailConfirmService.decodeConfirmationToken(confirmData.token);
    await this.emailConfirmService.confirmEmail(email);
  }

  @ApiBearerAuth()
  @Post('/resend-confirm')
  @UseGuards(JwtTwoFactorGuard)
  async resendEmailConfirmation(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.emailConfirmService.resendEmailConfirmation(poktPoolUser.email);
  }

  @Post('/change-email')
  async confirmChangeEmail(@Body() confirmChangeEmailDto: ConfirmChangeEmailDto) {
    await this.emailConfirmService.confirmChangeEmail(confirmChangeEmailDto);
  }
}
