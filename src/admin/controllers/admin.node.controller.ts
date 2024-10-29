import { Body, Param, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { FEATURE } from '../enums/admin.enum';
import { AdminNodeService } from '../services/admin.node.service';

@ApiTags('PoktPool Admin Node')
@ApiBearerAuth()
@Controller('admin-node')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminNodeController {
  constructor(private adminService: AdminService, private adminNodeService: AdminNodeService) {}

  @Get('/providers')
  async getProviders(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.NODE_DASHBOARD], poktPoolUser);
    return this.adminNodeService.getProviders();
  }

  @Get('/provider/:providerId')
  async getProviderDetails(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('providerId') providerId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.NODE_DASHBOARD], poktPoolUser);
    return this.adminNodeService.getProviderDetails(providerId);
  }
}
