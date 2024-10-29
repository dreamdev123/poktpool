import { Controller, Get, Query, Post, UseGuards, Body, Patch, Param, Put, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AdminUtilService } from 'src/pocket/services/admin.util.service';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { AdminPricingModelService } from '../services/admin.pricingmodel.service';
import { QueryPricingModelsDto } from '../dto/query-pricing-models.dto';
import { PutPricingModelDto } from '../dto/put-pricing-model.dto';
import { CreatePricingModelDto } from '../dto/create-pricing-model.dto';

@ApiTags('PoktPool Admin PricingModel API')
@Controller('admin-pricing-model')
@UseGuards(JwtTwoFactorGuard)
export class AdminPricingModelController {
  constructor(
    private adminPricingModelService: AdminPricingModelService,
    private adminUtilService: AdminUtilService,
  ) {}

  @Get('/vendors')
  async getVendors(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_PRICING_MODEL, poktPoolUser);
    return this.adminPricingModelService.getVendors();
  }

  @Get('/models')
  async getModels(
    @Query() queryPricingModelsDto: QueryPricingModelsDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_PRICING_MODEL, poktPoolUser);
    return this.adminPricingModelService.getModels(queryPricingModelsDto);
  }

  @Put('/model/:model_id')
  async updateModelById(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Param('model_id') model_id: string,
    @Body() putPricingModelDto: PutPricingModelDto,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_PRICING_MODEL, poktPoolUser);
    return this.adminPricingModelService.updateModelById(model_id, putPricingModelDto);
  }

  @Post('/model')
  async createModel(
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
    @Body() createPricingModelDto: CreatePricingModelDto,
  ) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_PRICING_MODEL, poktPoolUser);
    return this.adminPricingModelService.createModel(createPricingModelDto);
  }

  @Delete('/model/:model_id')
  async deleteModelById(@GetPoktPoolUser() poktPoolUser: PoktPoolUser, @Param('model_id') model_id: string) {
    await this.adminUtilService.checkPermission(FEATURE.ADMIN_PRICING_MODEL, poktPoolUser);
    return this.adminPricingModelService.deleteModelById(model_id);
  }
}
