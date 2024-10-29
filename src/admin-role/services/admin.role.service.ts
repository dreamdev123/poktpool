import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { AdminRoleQueryDto } from '../dto/admin-role-query.dto';
import { AdminRoleDeleteUserDto } from '../dto/admin-role-delete-user.dto';
import { AdminRoleDeleteFeatureDto } from '../dto/admin-role-delete-feature.dto';
import { AdminRoleAddUserDto } from '../dto/admin-role-add-user.dto';
import { AdminRoleQueryUserDto } from '../dto/admin-role-query-user.dto';
import { AdminRoleAddRoleDto } from '../dto/admin-role-add-role.dto';
import { AdminRolePutFeaturesDto } from '../dto/admin-role-put-features.dto';

@Injectable()
export class AdminRoleService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getRoles() {
    const pools = await this.knex('pool').select(['pool_id', 'pool_name']);
    const roles = await this.knex('admin_role').select('*');
    return { pools, roles };
  }

  async addRole(adminRoleAddRoleDto: AdminRoleAddRoleDto) {
    const [result] = await this.knex('admin_role')
      .insert({
        pool_id: adminRoleAddRoleDto.pool_id,
        role_name: adminRoleAddRoleDto.role_name,
      })
      .returning('*');
    return result;
  }

  async getRoleUsers(adminRoleQueryDto: AdminRoleQueryDto) {
    const users = await this.knex('user_role')
      .innerJoin('pokt_pool_user', 'user_role.user_id', 'pokt_pool_user.user_id')
      .select(['pokt_pool_user.user_id', 'pokt_pool_user.email', 'pokt_pool_user.username'])
      .where({
        role_id: adminRoleQueryDto.role_id,
      });
    return users;
  }

  async getUsers(adminRoleQueryUserDto: AdminRoleQueryUserDto) {
    const users = await this.knex('pokt_pool_user')
      .select(['user_id', 'email', 'username'])
      .whereILike('username', `${adminRoleQueryUserDto.username}%`)
      .limit(11);
    return users;
  }

  async deleteRoleUser(adminRoleQueryDto: AdminRoleQueryDto, adminRoleDeleteUserDto: AdminRoleDeleteUserDto) {
    await this.knex('user_role').delete().where({
      role_id: adminRoleQueryDto.role_id,
      user_id: adminRoleDeleteUserDto.user_id,
    });
  }

  async addRoleUser(adminRoleQueryDto: AdminRoleQueryDto, adminRoleAddUserDto: AdminRoleAddUserDto) {
    const user = await this.knex('pokt_pool_user').first('user_id').where({
      username: adminRoleAddUserDto.username,
    });
    if (!user) {
      throw new BadRequestException();
    }
    await this.knex('user_role').insert({
      role_id: adminRoleQueryDto.role_id,
      user_id: user.user_id,
    });
  }

  async getRoleFeatures(adminRoleQueryDto: AdminRoleQueryDto) {
    const features = await this.knex('role_grants')
      .innerJoin('feature', 'feature.feature_id', 'role_grants.feature_id')
      .select('feature.*')
      .where({
        role_id: adminRoleQueryDto.role_id,
      });
    return features;
  }

  async getFeatures() {
    const features = await this.knex('feature').select('*');
    return features;
  }

  async deleteRoleFeature(
    adminRoleQueryDto: AdminRoleQueryDto,
    adminRoleDeleteFeatureDto: AdminRoleDeleteFeatureDto,
  ) {
    await this.knex('role_grants').delete().where({
      role_id: adminRoleQueryDto.role_id,
      feature_id: adminRoleDeleteFeatureDto.feature_id,
    });
  }

  async putRoleFeatures(
    adminRoleQueryDto: AdminRoleQueryDto,
    adminRolePutFeaturesDto: AdminRolePutFeaturesDto,
  ) {
    await this.knex('role_grants').delete().where({
      role_id: adminRoleQueryDto.role_id,
    });

    if (adminRolePutFeaturesDto.feature_ids.length > 0) {
      await this.knex('role_grants').insert(
        adminRolePutFeaturesDto.feature_ids.map((feature_id) => ({
          role_id: adminRoleQueryDto.role_id,
          feature_id,
        })),
      );
    }
  }
}
