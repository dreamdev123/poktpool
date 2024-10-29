import {
  Controller,
  Body,
  Get,
  Post,
  Logger,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { UnstakeConfirmDto } from 'src/users/dto/user-unstake.dto';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { WithdrawService } from '../services/withdraw.service';
import { CancelUnstakeDto } from '../dto/cancel-unstake-percent.dto';
import { VerifyIDGuard } from 'src/auth/guards/verify-id.guard';
import { CustomerQueryDto } from 'src/customer/dto/customer-query.dto';
import { UpdateSweepPercentDto } from '../dto/update-sweep-percent.dto';
import { CustomerService } from 'src/customer/services/customer.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { OneTimeCodeService } from 'src/one-time-code/services/one-time-code.service';
import { TXN_TYPE_CODE } from 'src/constants';

@ApiTags('poktpool withdraw')
@ApiBearerAuth()
@Controller('withdraw')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class WithdrawController {
  private logger = new Logger('WithdrawController');
  constructor(
    private withdrawService: WithdrawService,
    private customerService: CustomerService,
    private oneTimeCodeService: OneTimeCodeService,
  ) {}

  @Get('/sweep-percent')
  async getSweepPercent(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.getSweepPercent(customer);
  }

  @UseGuards(VerifyIDGuard)
  @Patch('/sweep-percent')
  async updateSweepPercent(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() updateSweepPercentDto: UpdateSweepPercentDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.updateSweepPercent(customer, updateSweepPercentDto);
  }

  // Get a list of all user sweeps
  @Get('/sweeps')
  async getSweeps(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.getSweeps(customer);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/request-unstake-code')
  async requestUnstakeCode(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.oneTimeCodeService.sendCode(poktPoolUser, TXN_TYPE_CODE.UNSTAKE);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/unstake')
  async userUnstake(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() unstakeConfirm: UnstakeConfirmDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.userUnstakeRequest(poktPoolUser, customer, unstakeConfirm);
  }

  @Get('/unstakes')
  async getUnstakes(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.getUnstakes(customer);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/cancel-unstake')
  async getStakeById(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() cancelUnstake: CancelUnstakeDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.withdrawService.cancelUnstake(customer, cancelUnstake);
  }
}
