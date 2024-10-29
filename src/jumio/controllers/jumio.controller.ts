import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { JumioService } from '../services/jumio.service';
import { VerifyEmailGuard } from 'src/auth/guards/verify-email.guard';

@ApiTags('PoktPool KYC')
@Controller('jumio')
export class JumioController {
  constructor(private jumioService: JumioService) {}

  @ApiBearerAuth()
  @UseGuards(VerifyEmailGuard)
  @UseGuards(JwtTwoFactorGuard)
  @Get('/kyc-status')
  async getKYCStatus(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.jumioService.getKYCStatus(poktPoolUser);
  }

  @ApiBearerAuth()
  @UseGuards(VerifyEmailGuard)
  @UseGuards(JwtTwoFactorGuard)
  @Post('/kyc-retry')
  async retryKYC(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.jumioService.retryKYC(poktPoolUser);
  }

  @Post('/jumio-update')
  async jumioUpdate(@Body() payload) {
    return this.jumioService.jumioUpdate(payload);
  }
}
