import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Res,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { GetPoktPoolUser } from '../decorator/get-user.decorator';
import { TwoFactorAuthDto } from '../dto/two-factor-auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import { PoktPoolUser } from '../entities/user.entity';

@ApiTags('PoktPool Two Factor Authentication')
@Controller('2fa')
@UseInterceptors(ClassSerializerInterceptor)
@UsePipes(new ValidationPipe({ transform: true }))
export class TwoFactorAuth {
  constructor(private readonly twoFactorAuthService: TwoFactorAuthService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-qr')
  async generateQrCode(@Res() response: Response, @GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    const { otpassAuthUrl } = await this.twoFactorAuthService.generateTwoFactorSecret(poktPoolUser);
    response.setHeader('content-type', 'image/png');
    return this.twoFactorAuthService.qrCodeStreamPipe(response, otpassAuthUrl);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('enable-qr')
  async enableTwoFactorAuth(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body(ValidationPipe) twoFactorAuthDto: TwoFactorAuthDto,
  ) {
    if (!poktPoolUser.twoFactorSecret) {
      throw new BadRequestException('QR not generated yet');
    }
    const isValid = this.twoFactorAuthService.verifyTwoFactorCode(
      twoFactorAuthDto.twoFactorCode,
      poktPoolUser,
    );
    if (!isValid) {
      throw new BadRequestException('You have provided an invalid authentication code');
    }
    const codes = await this.twoFactorAuthService.enableTwoFactorAuth(poktPoolUser);
    return { codes };
  }

  @ApiBearerAuth()
  @Post('disable-qr')
  @UseGuards(JwtAuthGuard)
  async disableTwoFactorAuth(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() twoFactorAuthDto: TwoFactorAuthDto,
  ) {
    if (!poktPoolUser.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }
    await this.twoFactorAuthService.checkTwoFactorAuthDto(twoFactorAuthDto, poktPoolUser);
    await this.twoFactorAuthService.disableTwoFactorAuth(poktPoolUser);
  }
}
