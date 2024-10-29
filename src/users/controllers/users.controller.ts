import { Query, Controller, Get, UseGuards, UsePipes, ValidationPipe, Post, Body, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from '../../auth/entities/user.entity';
import { UsersService } from '../services/user.service';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { BalanceHistoryFilterDto } from 'src/stake/dto/balance-history-filter.dto';
import { CustomerService } from 'src/customer/services/customer.service';
import { CustomerQueryDto } from 'src/customer/dto/customer-query.dto';
import { Customer } from 'src/auth/entities/customer.entity';
import { SubmitTxDto } from '../dto/submit-tx.dto';
import { GetWalletBalanceDto } from '../dto/get-wallet-balance.dto';
import { PocketService } from 'src/pocket/services/pocket.service';
import { HistoryQueryDto } from '../dto/history-query.dto';
import { UpdateNotificationSettingsDto } from '../dto/update-notification-settings.dto';
import { SubmitPromoCodeDto } from '../dto/submit-promo-code.dto';
import { PromoCodeService } from '../services/promo-code.service';

@ApiTags('PoktPool User')
@ApiBearerAuth()
@Controller('user')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class UsersController {
  constructor(
    private usersService: UsersService,
    private promoCodeService: PromoCodeService,
    private customerService: CustomerService,
    private pocketService: PocketService,
  ) {}

  @Get()
  async getPoktPoolUserInfo(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.usersService.getPoktPoolUserInfo(poktPoolUser);
  }

  @Get('/portfolio')
  async getPortfolio(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.usersService.getPortfolio(poktPoolUser);
  }

  @Get('/data')
  async getUserData(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.usersService.getUserData(customer);
  }

  @Get('/balance-history')
  async getUserBalanceHistory(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() filterDto: BalanceHistoryFilterDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, {
      customerId: filterDto.customerId,
    });
    return this.usersService.getUserBalanceHistory(customer, filterDto);
  }

  @Get('/reward-history')
  async getUserRewardHistory(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.usersService.getUserRewardHistory(customer);
  }

  @Get('/download-history')
  async downloadHistory(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() historyQueryDto: HistoryQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, {
      customerId: historyQueryDto.customerId,
    });
    return this.usersService.downloadHistory(customer, historyQueryDto);
  }

  @Post('/submit-tx')
  async submitTx(@Body() submitTxDto: SubmitTxDto) {
    return this.usersService.submitTx(submitTxDto);
  }

  @Get('/wallet-balance')
  async getWalletBalance(@Query() getWalletBalanceDto: GetWalletBalanceDto) {
    const blockId = await this.pocketService.getBlockHeight();
    const balance = await this.pocketService.getWalletBalance({
      walletAddress: getWalletBalanceDto.address,
      blockId,
    });
    return { balance: balance.toFixed(0) };
  }

  @Get('/monthly-statement')
  async getMonthlyStatement(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.usersService.getMonthlyStatement(customer);
  }

  @Get('/notification-settings')
  async getNotificationSettings(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.usersService.getNotificationSettings(poktPoolUser);
  }

  @Put('/notification-settings')
  async updateNotificationSettings(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() updateNotificationSettingsDto: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(poktPoolUser, updateNotificationSettingsDto);
  }

  @Post('/promo-code')
  async submitPromoCode(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() submitPromoCodeDto: SubmitPromoCodeDto,
  ) {
    return this.promoCodeService.submitPromoCode(poktPoolUser, submitPromoCodeDto);
  }

  @Get('/promotions')
  async getPromotions(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.promoCodeService.getPromotions(poktPoolUser);
  }
}
