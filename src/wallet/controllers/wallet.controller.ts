import {
  Body,
  Query,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
  Param,
} from '@nestjs/common';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { VerifyIDGuard } from 'src/auth/guards/verify-id.guard';
import { WalletService } from '../services/wallet.service';
import { AddWalletDto } from '../dto/add-wallet.dto';
import { CheckWalletDto } from '../dto/check-wallet.dto';
import { RetryWalletDto } from '../dto/retry-wallet.dto';
import { EditWalletDto } from '../dto/edit-wallet.dto';

@ApiTags('Poktpool Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class WalletController {
  constructor(private walletService: WalletService) {}

  @UseGuards(VerifyIDGuard)
  @Post('/add')
  async addNewWallet(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Body() addWalletDto: AddWalletDto) {
    return this.walletService.addNewWallet(poktPoolUser, addWalletDto);
  }

  @Patch('/edit/:customerId')
  async editWallet(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('customerId') customerId: string,
    @Body() editWalletDto: EditWalletDto,
  ) {
    return this.walletService.editWallet(poktPoolUser, customerId, editWalletDto);
  }

  @UseGuards(VerifyIDGuard)
  @Get('/check-wallet')
  async checkWallet(@Query() checkWalletDto: CheckWalletDto) {
    await this.walletService.checkWallet(checkWalletDto);
  }

  @Get('/list')
  async listWallets(@GetPoktPoolUser() poktPoolUser) {
    return this.walletService.listWallets(poktPoolUser);
  }

  @UseGuards(VerifyIDGuard)
  @Post('/retry')
  async retryWallet(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Body() retryWalletDto: RetryWalletDto) {
    return this.walletService.retryWallet(poktPoolUser, retryWalletDto);
  }
}
