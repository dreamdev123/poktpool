import {
  Body,
  Param,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminService } from '../services/admin.service';
import { FEATURE } from '../enums/admin.enum';
import { AdminWalletService } from '../services/admin.wallet.service';
import { UpdateWalletsOrderDto } from '../dto/update-wallets-order.dto';
import { EditAdminWalletDto } from '../dto/edit-wallet.dto';

@ApiTags('PoktPool Admin Wallets')
@ApiBearerAuth()
@Controller('admin-wallets')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class AdminWalletController {
  constructor(private adminService: AdminService, private adminWalletService: AdminWalletService) {}

  @Get('/list')
  async getAdminWallets(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.WALLET_BALANCES], poktPoolUser);
    return this.adminWalletService.getAdminWallets();
  }

  @Get('/details/:walletId')
  async getAdminWalletDetails(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('walletId') walletId: string,
  ) {
    await this.adminService.checkPermissions([FEATURE.WALLET_BALANCES], poktPoolUser);
    return this.adminWalletService.getAdminWalletDetails(walletId);
  }

  @Patch('/edit')
  async editWallet(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Body() editWalletDto: EditAdminWalletDto) {
    await this.adminService.checkPermissions([FEATURE.WALLET_BALANCES], poktPoolUser);
    return this.adminWalletService.editWallet(editWalletDto);
  }

  @Post('/order')
  async updateWalletsOrder(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() updateWalletsOrderDto: UpdateWalletsOrderDto,
  ) {
    await this.adminService.checkPermissions([FEATURE.WALLET_BALANCES], poktPoolUser);
    return this.adminWalletService.updateWalletsOrder(updateWalletsOrderDto);
  }
}
