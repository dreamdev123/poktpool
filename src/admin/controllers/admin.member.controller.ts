import { Body, Controller, Get, Post, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { FEATURE } from '../enums/admin.enum';
import { MemberLookupDto } from '../dto/member-lookup.dto';
import { AdminMemberService } from '../services/admin.member.service';
import { GetMemberDetailsDto } from '../dto/get-member-details.dto';
import { MemberCustomerQueryDto } from '../dto/member-customer-query.dto';

@ApiTags('PoktPool Admin Member')
@ApiBearerAuth()
@Controller('admin-member')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminMemberController {
  constructor(private adminService: AdminService, private adminMemberService: AdminMemberService) {}

  @Get('/lookup')
  async getMemberLookup(
    @Query() memberLookupDto: MemberLookupDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    console.log('ADMIN_MEMBER_LOOKUP', {
      adminEmail: poktPoolUser.email,
      memberLookupDto,
    });
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberLookup(memberLookupDto);
  }

  @Get('/details')
  async getMemberDetails(
    @Query() getMemberDetailsDto: GetMemberDetailsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberDetails(getMemberDetailsDto);
  }

  @Get('/stakes')
  async getMemberStakes(
    @Query() customerQueryDto: MemberCustomerQueryDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberStakes(customerQueryDto);
  }

  @Get('/sweeps')
  async getMemberSweeps(
    @Query() customerQueryDto: MemberCustomerQueryDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberSweeps(customerQueryDto);
  }

  @Get('/unstakes')
  async getMemberUnstakes(
    @Query() customerQueryDto: MemberCustomerQueryDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberUnstakes(customerQueryDto);
  }

  @Get('/transfers')
  async getMemberTransfers(
    @Query() customerQueryDto: MemberCustomerQueryDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberTransfers(customerQueryDto);
  }

  @Get('/wallets')
  async getMemberWallets(
    @Query() getMemberDetailsDto: GetMemberDetailsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.getMemberWallets(getMemberDetailsDto);
  }

  @Post('/reset-2fa')
  async reset2FA(
    @Body() getMemberDetailsDto: GetMemberDetailsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.reset2FA(getMemberDetailsDto);
  }

  @Post('/reset-kyc')
  async resetKYC(
    @Body() getMemberDetailsDto: GetMemberDetailsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.resetKYC(getMemberDetailsDto);
  }

  @Post('/approve-kyc')
  async approveKYC(
    @Body() getMemberDetailsDto: GetMemberDetailsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.MEMBER_LOOKUP], poktPoolUser);
    return this.adminMemberService.approveKYC(getMemberDetailsDto);
  }
}
