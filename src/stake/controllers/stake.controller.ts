import { Body, Query, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateStakeDto } from '../dto/create-stake.dto';
import { StakeService } from '../services/stake.service';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { Logger } from '@nestjs/common';
import { VerifyIDGuard } from 'src/auth/guards/verify-id.guard';
import { QueryCustomerDto } from '../dto/query-customer.dto';
import { TransferStakeDto } from '../dto/transfer-stake.dto';
import { CustomerService } from 'src/customer/services/customer.service';
import { CustomerQueryDto } from 'src/customer/dto/customer-query.dto';
import { Customer } from 'src/auth/entities/customer.entity';
import { OneTimeCodeService } from 'src/one-time-code/services/one-time-code.service';
import { TXN_TYPE_CODE } from 'src/constants';

@ApiTags('poktpool Stake')
@ApiBearerAuth()
@Controller('stake')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class StakeController {
  private logger = new Logger('StakesController');
  constructor(
    private stakeService: StakeService,
    private customerService: CustomerService,
    private oneTimeCodeService: OneTimeCodeService,
  ) {}

  @Get('/transactions')
  async getTransactions(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.stakeService.getTransactions(customer);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/transaction')
  async createNewStake(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() createStakeDto: CreateStakeDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.stakeService.addNewStake(customer, createStakeDto);
  }

  @Get('/transfer/query-customer')
  queryCustomer(@Query() queryCustomerDto: QueryCustomerDto) {
    return this.stakeService.queryCustomer(queryCustomerDto);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/request-transfer-code')
  async requestTransferCode(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.oneTimeCodeService.sendCode(poktPoolUser, TXN_TYPE_CODE.TRANSFER);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/transfer')
  async transferStake(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() transferStakeDto: TransferStakeDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.stakeService.transferStake(poktPoolUser, customer, transferStakeDto);
  }

  @Get('/transfers')
  async getTransfers(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerService.getCustomer(poktPoolUser, customerQueryDto);
    return this.stakeService.getTransfers(customer);
  }
}
