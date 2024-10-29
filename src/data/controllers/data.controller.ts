import { Controller, Get, Query, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BalanceHistoryFilterDto } from '../dto/balance-history-filter.dto';
import { DataService } from '../services/data.service';

// @UseInterceptors(CacheInterceptor)
@ApiTags('PoktPool Public Data')
@Controller('/data')
@UsePipes(new ValidationPipe({ transform: true }))
export class DataController {
  constructor(private dataService: DataService) {}

  @Get('/pool-metrics')
  getPoolMetrics() {
    return this.dataService.getPoolMetrics();
  }

  @Get('/balance-history')
  async getStakedBalanceHistory(@Query() filterDto: BalanceHistoryFilterDto) {
    return this.dataService.getStakedBalanceHistory(filterDto);
  }
}
