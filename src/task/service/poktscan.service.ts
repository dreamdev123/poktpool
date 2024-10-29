import { Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { NETWORK_ID } from 'src/constants';
import { CURRENCY_CODE } from 'src/types/currency_xref';
import { PocketService } from 'src/pocket/services/pocket.service';

export const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

@Injectable()
export class PoktscanService {
  constructor(
    private readonly pocketService: PocketService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  private async poktscanGraphQL(query) {
    const { data } = await lastValueFrom(
      this.httpService.post(
        this.configService.get('poktscanApi'),
        {
          query,
        },
        {
          headers: {
            authorization: this.configService.get('POKTSCAN_V2_API_KEY'),
          },
        },
      ),
    );
    return data;
  }

  private async getVendorByServiceDomain(node_runner) {
    const vendor = await this.nodeKnex('vendor').first('*').where({
      vendor_domain: node_runner.service_domain,
    });
    if (vendor) return vendor;

    const [result] = await this.nodeKnex('vendor')
      .insert({
        vendor_name: node_runner.service_domain,
        vendor_domain: node_runner.service_domain,
      })
      .returning('*');
    return result;
  }

  private async feedVendorNetworkRewards(vendor, node_runner) {
    await sleep(4000);

    const {
      data: { GetSummaryForNodeSelection },
    } = await this.poktscanGraphQL(`
      query {
        GetSummaryForNodeSelection(input: { service_domain: "${node_runner.service_domain}" }) {
          last_height
          total_tokens_staked
          total_nodes
          nodes_staked
          validators
          producer_rewards_last_24hrs
          servicer_rewards_last_24hrs
          validators_tokens_staked
          total_tokens_staked
          relays_last_24hrs
          total_rewards_last_24hrs
        }
      }
    `);

    const result = {
      vendor_id: vendor.vendor_id,
      network_id: NETWORK_ID.POKT,
      currency_code: CURRENCY_CODE.UPOKT,

      tokens_staked: GetSummaryForNodeSelection.total_tokens_staked,
      servicer_nodes: GetSummaryForNodeSelection.nodes_staked,
      validator_nodes: GetSummaryForNodeSelection.validators,

      validator_rewards: GetSummaryForNodeSelection.producer_rewards_last_24hrs,
      servicer_rewards: GetSummaryForNodeSelection.servicer_rewards_last_24hrs,
      validator_tokens_staked: GetSummaryForNodeSelection.validators_tokens_staked,
      servicer_tokens_staked:
        GetSummaryForNodeSelection.total_tokens_staked - GetSummaryForNodeSelection.validators_tokens_staked,
      relays: GetSummaryForNodeSelection.relays_last_24hrs,
      rewards: GetSummaryForNodeSelection.total_rewards_last_24hrs,
      block_id: GetSummaryForNodeSelection.last_height,
      block_ts: await this.pocketService.getBlockTime(GetSummaryForNodeSelection.last_height),
    };
    await this.nodeKnex('vendor_network_rewards').insert(result);
  }

  public async vendorNetworkRewards() {
    const {
      data: { ListLargestNodeRunners },
    } = await this.poktscanGraphQL(`
      query {
        ListLargestNodeRunners(input: { top: 5000, sort_by: power }) {
          block
          total_tokens
          items {
            service_domain
            tokens
            power
            validators_power
            validators
            staked
            jailed
          }
        }
      }
    `);
    for (const node_runner of ListLargestNodeRunners.items) {
      const vendor = await this.getVendorByServiceDomain(node_runner);
      await this.feedVendorNetworkRewards(vendor, node_runner);
    }
  }
}
