import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { pick } from 'lodash';
import { QueryPricingModelsDto } from '../dto/query-pricing-models.dto';
import { PutPricingModelDto } from '../dto/put-pricing-model.dto';
import { CreatePricingModelDto } from '../dto/create-pricing-model.dto';

@Injectable()
export class AdminPricingModelService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getVendors() {
    const networks = await this.nodeKnex('network').select('*');
    const vendors = await this.nodeKnex('vendor').select('*');
    return { networks, vendors };
  }

  async getModels(queryPricingModelsDto: QueryPricingModelsDto) {
    const models = await this.nodeKnex('vendor_pricing_model').select('*').where({
      vendor_id: queryPricingModelsDto.vendor_id,
      network_id: queryPricingModelsDto.network_id,
    });
    return models;
  }

  async updateModelById(model_id: string, putPricingModelDto: PutPricingModelDto) {
    const [result] = await this.nodeKnex('vendor_pricing_model')
      .update({
        model_name: putPricingModelDto.model_name,
        fiat_per_node: putPricingModelDto.fiat_per_node,
        rev_share_rate: putPricingModelDto.rev_share_rate,
        tokens_per_node: putPricingModelDto.tokens_per_node,
      })
      .where({
        model_id,
      })
      .returning('*');
    return result;
  }

  async createModel(createPricingModelDto: CreatePricingModelDto) {
    const [result] = await this.nodeKnex('vendor_pricing_model')
      .insert({
        network_id: createPricingModelDto.network_id,
        vendor_id: createPricingModelDto.vendor_id,
        model_name: createPricingModelDto.model_name,
        fiat_per_node: createPricingModelDto.fiat_per_node,
        rev_share_rate: createPricingModelDto.rev_share_rate,
        tokens_per_node: createPricingModelDto.tokens_per_node,
      })
      .returning('*');
    return result;
  }

  async deleteModelById(model_id: string) {
    await this.nodeKnex('vendor_pricing_model').delete().where({
      model_id,
    });
  }
}
