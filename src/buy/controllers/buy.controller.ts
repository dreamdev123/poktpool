import { Controller, Get, Query, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BuyService } from '../services/buy.service';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { CustomerQueryDto } from 'src/customer/dto/customer-query.dto';
import { CommitBuyDto } from '../dto/commit-buy.dto';
import { SubmitPaymentDto } from '../dto/submit-payment.dto';
import { BuyUtilService } from 'src/pocket/services/buy.util.service';
import { CustomerUtilService } from 'src/pocket/services/customer.util.service';
import { Customer } from 'src/auth/entities/customer.entity';
import { VerifyIDGuard } from 'src/auth/guards/verify-id.guard';

@ApiTags('PoktPool Buy API')
@Controller('/buy')
export class BuyController {
  constructor(
    private buyService: BuyService,
    private buyUtilService: BuyUtilService,
    private customerUtilService: CustomerUtilService,
  ) {}

  @Get('/pokt-available')
  async getPoktAvailable() {
    const { available } = await this.buyUtilService.getBalances();
    return { amount: available };
  }

  @Get('/pokt-price')
  getPoktPrice() {
    return this.buyService.getPoktPrice();
  }

  @Post('/commit')
  @UseGuards(VerifyIDGuard)
  @UseGuards(JwtTwoFactorGuard)
  async commit(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() commitBuyDto: CommitBuyDto,
  ) {
    const customer: Customer = await this.customerUtilService.getCustomer(poktPoolUser, {
      customerId: customerQueryDto.customerId,
    });
    return this.buyService.commit(customer, commitBuyDto);
  }

  @Get('/commit-history')
  @UseGuards(JwtTwoFactorGuard)
  async getCommitHistory(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
  ) {
    const customer: Customer = await this.customerUtilService.getCustomer(poktPoolUser, {
      customerId: customerQueryDto.customerId,
    });
    return this.buyService.getCommitHistory(customer);
  }

  @Post('/submit-payment')
  @UseGuards(VerifyIDGuard)
  @UseGuards(JwtTwoFactorGuard)
  async submitPayment(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Query() customerQueryDto: CustomerQueryDto,
    @Body() submitPaymentDto: SubmitPaymentDto,
  ) {
    const customer: Customer = await this.customerUtilService.getCustomer(poktPoolUser, {
      customerId: customerQueryDto.customerId,
    });
    return this.buyService.submitPayment(customer, submitPaymentDto);
  }
}
