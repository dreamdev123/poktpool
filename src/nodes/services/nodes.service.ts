import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { AddNodesDto } from '../dto/add-nodes.dto';
import { FilterNodesDto } from '../dto/filter-nodes.dto';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { Customer } from 'src/auth/entities/customer.entity';

@Injectable()
export class NodesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getPools(poktPoolUser: PoktPoolUser) {
    const poolIds = await this.knex('vw_user_permissions').select('pool_id').where({
      user_id: poktPoolUser.id,
      feature_id: FEATURE.ADD_NODES,
    });

    const data = await this.knex
      .select('*')
      .from('pool')
      .whereIn(
        'pool_id',
        poolIds.map(({ pool_id }) => pool_id),
      );
    return data;
  }

  async getVendors() {
    const data = await this.nodeKnex.select('*').from('vendor');
    return data;
  }

  async addNodes(addNodesDto: AddNodesDto) {
    const nodeAddresses = addNodesDto.nodeAddresses.map((address) => address.toUpperCase().trim());

    // unarchive nodes
    await this.nodeKnex('node')
      .update({ is_archived: false })
      .whereIn('node_address', nodeAddresses)
      .andWhere({ is_archived: true });

    const existingAddresses = await this.nodeKnex
      .select('node_address')
      .from('node')
      .whereIn('node_address', nodeAddresses);
    const filtered = nodeAddresses.filter(
      (address) => !existingAddresses.some(({ node_address }) => node_address === address),
    );

    if (filtered.length === 0) {
      return [];
    }

    const data = await this.nodeKnex('node')
      .insert(
        filtered.map((nodeAddress) => ({
          node_address: nodeAddress,
          pool_id: addNodesDto.poolId,
          vendor_id: addNodesDto.vendorId,
          network_id: 1,
        })),
      )
      .returning('*');
    return data;
  }

  async getNodes(filterNodesDto: FilterNodesDto) {
    const data = await this.knex('node').select('*').where({
      pool_id: filterNodesDto.poolId,
      vendor_id: filterNodesDto.vendorId,
    });
    return data;
  }
}
