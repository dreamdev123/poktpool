import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { BalanceHistoryFilterDto } from '../dto/balance-history-filter.dto';

@Injectable()
export class DataService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    private readonly httpService: HttpService,
  ) {}

  async getPoolMetrics() {
    const [pool_metrics, { latest_exchange: pokt_price }] = await Promise.all([
      this.knex('vw_pp_pool_metrics').first('*'),
      this.knex('vw_pp_latest_xerate').first('latest_exchange'),
    ]);
    return { ...pool_metrics, pokt_price };
  }

  async getStakedBalanceHistory(filterDto: BalanceHistoryFilterDto) {
    const query = this.knex.select('*').from('vw_pp_pool_balance_asof').orderBy('as_of_date');

    if (filterDto.startDate) {
      query.where('as_of_date', '>=', filterDto.startDate);
    }
    if (filterDto.endDate) {
      query.where('as_of_date', '<=', filterDto.endDate);
    }
    return query;
  }
}
