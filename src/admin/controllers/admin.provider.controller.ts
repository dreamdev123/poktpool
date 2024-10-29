import { Body, Param, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { FEATURE } from '../enums/admin.enum';
import { AdminProviderService } from '../services/admin.provider.service';
import { AddVendorDto } from '../dto/add-vendor.dto';
import { AddVendorSettingDto } from '../dto/add-vendor-setting.dto';

@ApiTags('PoktPool Admin Provider')
@ApiBearerAuth()
@Controller('admin-provider')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminProviderController {
  constructor(private adminService: AdminService, private adminProviderService: AdminProviderService) {}

  @Get('/data')
  async getData(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.getData();
  }

  @Post('/vendor')
  async addVendor(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Body() addVendorDto: AddVendorDto) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.addVendor(addVendorDto);
  }

  @Put('/vendor/:vendorId')
  async updateVendor(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() addVendorDto: AddVendorDto,
    @Param('vendorId') vendorId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.updateVendor(vendorId, addVendorDto);
  }

  @Get('/vendor-settings/:vendorId')
  async getVendorSettings(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('vendorId') vendorId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.getVendorSettings(vendorId);
  }

  @Post('/vendor-setting')
  async addVendorSetting(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() addVendorSettingDto: AddVendorSettingDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.addVendorSetting(addVendorSettingDto);
  }

  @Put('/vendor-setting')
  async updateVendorSetting(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() addVendorSettingDto: AddVendorSettingDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminProviderService.updateVendorSetting(addVendorSettingDto);
  }
}
