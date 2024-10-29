import { Controller, Get, Query, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminSellService } from '../services/admin.sell.service';
import { AdminUtilService } from 'src/pocket/services/admin.util.service';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { BuyUtilService } from 'src/pocket/services/buy.util.service';
import { RejectCommitDto } from '../dto/reject-commit.dto';
import { ProcessCommitDto } from '../dto/process-commit.dto';

@ApiTags('PoktPool Admin Sell API')
@Controller('admin-sell')
@UseGuards(JwtTwoFactorGuard)
export class AdminSellController {
  constructor(
    private adminSellService: AdminSellService,
    private adminUtilService: AdminUtilService,
    private buyUtilService: BuyUtilService,
  ) {}

  @Get('/balances')
  async getBalances(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminUtilService.checkPermission(FEATURE.SELL_POKT, poktPoolUser);
    return this.buyUtilService.getBalances();
  }

  @Get('/commits')
  async getCommits(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminUtilService.checkPermission(FEATURE.SELL_POKT, poktPoolUser);
    return this.adminSellService.getCommits();
  }

  @Post('/reject-commit')
  async rejectCommit(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() rejectCommitDto: RejectCommitDto,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.SELL_POKT, poktPoolUser);
    return this.adminSellService.rejectCommit(rejectCommitDto);
  }

  @Post('/process-commit')
  async processCommit(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() processCommitDto: ProcessCommitDto,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.SELL_POKT, poktPoolUser);
    return this.adminSellService.processCommit(processCommitDto);
  }
}
