import { Param, Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { FEATURE } from '../enums/admin.enum';
import { AdminTrancheService } from '../services/admin.tranche.service';
import { AdminFeature } from 'src/auth/decorator/admin-feature.decorator';

@ApiTags('PoktPool Admin Tranche')
@ApiBearerAuth()
@Controller('admin-tranche')
@AdminFeature(FEATURE.REPORT_CLOSED_TRANCHES)
@UseGuards(JwtTwoFactorGuard)
export class AdminTrancheController {
  constructor(private adminTrancheService: AdminTrancheService) {}

  @Get('/details/:trancheId')
  async getTrancheDetails(@Param('trancheId') trancheId: string) {
    return this.adminTrancheService.getTrancheDetails(trancheId);
  }
}
