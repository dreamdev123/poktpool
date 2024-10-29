import { Controller, Get, Query, Post, UseGuards, Body, Delete, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AdminRoleService } from '../services/admin.role.service';
import { AdminFeature } from 'src/auth/decorator/admin-feature.decorator';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { AdminRoleQueryDto } from '../dto/admin-role-query.dto';
import { AdminRoleDeleteUserDto } from '../dto/admin-role-delete-user.dto';
import { AdminRoleDeleteFeatureDto } from '../dto/admin-role-delete-feature.dto';
import { AdminRoleAddUserDto } from '../dto/admin-role-add-user.dto';
import { AdminRoleQueryUserDto } from '../dto/admin-role-query-user.dto';
import { AdminRoleAddRoleDto } from '../dto/admin-role-add-role.dto';
import { AdminRolePutFeaturesDto } from '../dto/admin-role-put-features.dto';

@ApiTags('PoktPool Admin Role API')
@Controller('admin-role')
@AdminFeature(FEATURE.ADMIN_ROLE_EDIT)
@UseGuards(JwtTwoFactorGuard)
export class AdminRoleController {
  constructor(private adminRoleService: AdminRoleService) {}

  @Get('/roles')
  async getRoles() {
    return this.adminRoleService.getRoles();
  }

  @Post('/role')
  async addRole(@Body() adminRoleAddRoleDto: AdminRoleAddRoleDto) {
    return this.adminRoleService.addRole(adminRoleAddRoleDto);
  }

  @Get('/role-users')
  async getRoleUsers(@Query() adminRoleQueryDto: AdminRoleQueryDto) {
    return this.adminRoleService.getRoleUsers(adminRoleQueryDto);
  }

  @Get('/users')
  async getUsers(@Query() adminRoleQueryUserDto: AdminRoleQueryUserDto) {
    return this.adminRoleService.getUsers(adminRoleQueryUserDto);
  }

  @Delete('/role-user')
  async deleteRoleUser(
    @Query() adminRoleQueryDto: AdminRoleQueryDto,
    @Body() adminRoleDeleteUserDto: AdminRoleDeleteUserDto,
  ) {
    return this.adminRoleService.deleteRoleUser(adminRoleQueryDto, adminRoleDeleteUserDto);
  }

  @Post('/role-user')
  async addRoleUser(
    @Query() adminRoleQueryDto: AdminRoleQueryDto,
    @Body() adminRoleAddUserDto: AdminRoleAddUserDto,
  ) {
    return this.adminRoleService.addRoleUser(adminRoleQueryDto, adminRoleAddUserDto);
  }

  @Get('/role-features')
  async getRoleFeatures(@Query() adminRoleQueryDto: AdminRoleQueryDto) {
    return this.adminRoleService.getRoleFeatures(adminRoleQueryDto);
  }

  @Get('/features')
  async getFeatures() {
    return this.adminRoleService.getFeatures();
  }

  @Delete('/role-feature')
  async deleteRoleFeature(
    @Query() adminRoleQueryDto: AdminRoleQueryDto,
    @Body() adminRoleDeleteFeatureDto: AdminRoleDeleteFeatureDto,
  ) {
    return this.adminRoleService.deleteRoleFeature(adminRoleQueryDto, adminRoleDeleteFeatureDto);
  }

  @Put('/role-features')
  async putRoleFeatures(
    @Query() adminRoleQueryDto: AdminRoleQueryDto,
    @Body() adminRolePutFeaturesDto: AdminRolePutFeaturesDto,
  ) {
    return this.adminRoleService.putRoleFeatures(adminRoleQueryDto, adminRolePutFeaturesDto);
  }
}
