import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { SegmentQueryDto } from '../dto/segment-query.dto';
import { PatchSegmentDto } from '../dto/patch-segment.dto';

@Injectable()
export class AdminSegmentService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getPools() {
    const pools = await this.knex('pool').select(['pool_id', 'pool_name']);
    return pools;
  }

  async getSegments(segmentQueryDto: SegmentQueryDto) {
    const segments = await this.knex('customer_segment').select('*').where({
      pool_id: segmentQueryDto.pool_id,
    });
    return segments;
  }

  async patchSegment(patchSegmentDto: PatchSegmentDto) {
    for (const patchSegment of patchSegmentDto.updates) {
      await this.knex('customer_segment')
        .update({
          infra_rate: patchSegment.infra_rate,
          ppinc_commission_rate: patchSegment.ppinc_commission_rate,
        })
        .where({
          segment_id: patchSegment.segment_id,
        });
    }
    return;
  }
}
