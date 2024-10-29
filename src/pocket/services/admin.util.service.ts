import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { PoktPoolUser } from 'src/auth/entities/user.entity';

@Injectable()
export class AdminUtilService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async checkPermission(feature_id: FEATURE, poktPoolUser: PoktPoolUser, poolId = 1) {
    const permissions = await this.knex('vw_user_permissions').select('*').where({
      user_id: poktPoolUser.id,
      pool_id: poolId,
      feature_id,
    });
    if (permissions.length > 0) {
      return true;
    }

    throw new ForbiddenException('No permission');
  }
}
