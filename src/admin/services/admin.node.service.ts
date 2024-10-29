import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';

@Injectable()
export class AdminNodeService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getProviders() {
    const providers = await this.nodeKnex('vw_vendor_stakes').select('*').where({
      pool_id: 1,
      is_active: true,
    });
    const blockId = await this.pocketService.getDBBlockHeight();
    return { blockId, providers };
  }

  async getProviderDetails(providerId) {
    const provider = await this.nodeKnex('vw_vendor_stakes').first('*').where({
      vendor_id: providerId,
      pool_id: 1,
    });
    const blockId = await this.pocketService.getDBBlockHeight();
    const nodes = await this.nodeKnex('node').select('*').where({
      vendor_id: providerId,
    });
    return { blockId, provider, nodes };
  }
}
