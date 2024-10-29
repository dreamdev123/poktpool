import {
  Body,
  Param,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { CloseTrancheDto } from '../dto/close-tranche.dto';
import { FEATURE } from '../enums/admin.enum';
import { VendorToAggregatedDto } from '../dto/vendor-to-aggregated.dto';
import { AdminVendorService } from '../services/admin.vendor.service';
import { DistributePostTrancheDto } from '../dto/distribute-post-tranche.dto';
import { AdminDistributeService } from '../services/admin.distribute.service';
import { CompleteTrancheDto } from '../dto/complete-tranche.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('PoktPool Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminController {
  constructor(
    private adminService: AdminService,
    private adminVendorService: AdminVendorService,
    private adminDistributeService: AdminDistributeService,
  ) {}

  @Get('/pool-member-stats')
  async getPoolMemberStats(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.SUPER_ADMIN_REPORT], poktPoolUser);
    return this.adminService.getPoolMemberStats();
  }

  @Get('/stake-position-report')
  async getStakePositionReport(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.STAKE_POSITION_REPORT], poktPoolUser);
    return this.adminService.getStakePositionReport();
  }

  @Get('/upcoming-unstakes')
  async getUpcomingUnstakes(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.getUpcomingUnstakes();
  }

  @Get('/upcoming-stakes')
  async getUpcomingStakes(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.UPCOMING_STAKES], poktPoolUser);
    return this.adminService.getUpcomingStakes();
  }

  @Get('/individual-unstakes')
  async getIndividualUnstakes(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.INDIVIDUAL_UNSTAKES], poktPoolUser);
    return this.adminService.getIndividualUnstakes();
  }

  @Get('/tranche/current-open')
  async getCurrentOpenTranche(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.getCurrentOpenTranche();
  }

  @Get('/tranche-stats/:trancheId')
  async getTrancheStatsById(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('trancheId') trancheId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.getTrancheStatsById(trancheId);
  }

  @Get('/tranche-txs/:trancheId')
  async getTrancheTxsById(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('trancheId') trancheId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.getTrancheTxsById(trancheId);
  }

  @Get('/closed-tranches')
  async getClosedTranches(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.REPORT_CLOSED_TRANCHES], poktPoolUser);
    return this.adminService.getClosedTranches();
  }

  @Get('/tranche/:trancheId')
  async getTrancheById(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Param('trancheId') trancheId: string) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.getTrancheById(trancheId);
  }

  @Throttle(1, 60)
  @Post('/close-tranche')
  async closeTranche(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() closeTrancheDto: CloseTrancheDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.closeTranche(closeTrancheDto);
  }

  @Post('/estimate-tranche')
  async estimateTranche(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() closeTrancheDto: CloseTrancheDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.estimateTranche(closeTrancheDto);
  }

  @Throttle(1, 60)
  @Post('/complete-tranche')
  async completeTranche(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() completeTrancheDto: CompleteTrancheDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminService.completeTranche(completeTrancheDto);
  }

  @Throttle(1, 60)
  @Post('/distribute-post-tranche')
  async distributePostTranche(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() distributePostTrancheDto: DistributePostTrancheDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminDistributeService.distributePostTranche(distributePostTrancheDto);
  }

  @Throttle(1, 60)
  @Post('/vendor-to-aggregated')
  async vendorToAggregated(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() vendorToAggregatedDto: VendorToAggregatedDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminVendorService.vendorToAggregated(vendorToAggregatedDto);
  }

  @Get('/vendor-wallet-balances/:trancheId')
  async getVendorWalletBalances(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('trancheId') trancheId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
    return this.adminVendorService.getVendorWalletBalances(Number(trancheId));
  }

  @Get('/vendor-to-aggregated/:trancheId')
  async getVendorToAggregated(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('trancheId') trancheId: string,
  ) {
    try {
      await this.adminService.checkPermissions([FEATURE.TRANCHE_CLOSE], poktPoolUser);
      return this.adminVendorService.getVendorToAggregated(Number(trancheId));
    } catch (err) {
      console.log('VENDOR_TO_AGG_ERROR', err);
      throw new InternalServerErrorException();
    }
  }
}
