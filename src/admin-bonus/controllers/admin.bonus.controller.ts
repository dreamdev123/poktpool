import { Controller, Get, Query, Post, UseGuards, Body, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminUtilService } from 'src/pocket/services/admin.util.service';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { AdminBonusService } from '../services/admin.bonus.service';
import { AddDistributionTypeDto } from '../dto/add-distribution-type.dto';
import { SendBonusDto } from '../dto/send-bonus.dto';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';

@ApiTags('PoktPool Admin Bonus API')
@Controller('admin-bonus')
@UseGuards(JwtTwoFactorGuard)
export class AdminBonusController {
  constructor(private adminBonusService: AdminBonusService, private adminUtilService: AdminUtilService) {}

  @Get('/categories')
  async getCategories(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_BONUS, poktPoolUser);
    return this.adminBonusService.getCategories();
  }

  @Post('/distribution-type')
  async addDistributionType(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() addDistributionTypeDto: AddDistributionTypeDto,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_BONUS, poktPoolUser);
    return this.adminBonusService.addDistributionType(addDistributionTypeDto);
  }

  @Post('/bonus')
  async sendBonus(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Body() sendBonusDto: SendBonusDto) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_BONUS, poktPoolUser);
    return this.adminBonusService.sendBonus(sendBonusDto);
  }

  @Get('/transactions')
  async getTransactions(
    @Query() queryTransactionsDto: QueryTransactionsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_BONUS, poktPoolUser);
    return this.adminBonusService.getTransactions(queryTransactionsDto);
  }
}
