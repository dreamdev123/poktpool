import { Body, Query, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { NodesService } from '../services/nodes.service';
import { AddNodesDto } from '../dto/add-nodes.dto';
import { FilterNodesDto } from '../dto/filter-nodes.dto';
import { AdminService } from 'src/admin/services/admin.service';
import { FEATURE } from 'src/admin/enums/admin.enum';

@ApiTags('PoktPool Nodes')
@ApiBearerAuth()
@Controller('nodes')
@UseGuards(JwtTwoFactorGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class NodesController {
  constructor(private nodesService: NodesService, private adminService: AdminService) {}

  @Get('/pools')
  async getPools(
    @GetPoktPoolUser()
    poktPoolUser: PoktPoolUser,
  ) {
    return this.nodesService.getPools(poktPoolUser);
  }

  @Get('/vendors')
  async getVendors(
    @GetPoktPoolUser()
    poktPoolUser: PoktPoolUser,
  ) {
    await this.adminService.checkPermissions([FEATURE.ADD_NODES], poktPoolUser);
    return this.nodesService.getVendors();
  }

  @Post('/nodes')
  async addNodes(@Body() addNodesDto: AddNodesDto, @GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.ADD_NODES], poktPoolUser, addNodesDto.poolId);
    return this.nodesService.addNodes(addNodesDto);
  }

  @Get('/nodes')
  async getNodes(@Query() filterNodesDto: FilterNodesDto, @GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    await this.adminService.checkPermissions([FEATURE.ADD_NODES], poktPoolUser, filterNodesDto.poolId);
    return this.nodesService.getNodes(filterNodesDto);
  }
}
