import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectKnex, Knex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { ConnectionName } from 'src/database/enums/connection.enum';
import { PocketService } from 'src/pocket/services/pocket.service';
import { AddVendorDto } from '../dto/add-vendor.dto';
import { AddVendorSettingDto } from '../dto/add-vendor-setting.dto';

@Injectable()
export class AdminProviderService {
  constructor(
    private readonly configService: ConfigService,
    private readonly pocketService: PocketService,
    @InjectKnex() private readonly knex: Knex,
    @InjectKnex(ConnectionName.NODE) private readonly nodeKnex: Knex,
  ) {}

  async getData() {
    const vendors = await this.nodeKnex('vendor').select('*');
    const pools = await this.nodeKnex('pool').select('*');
    return { vendors, pools };
  }

  async addVendor(addVendorDto: AddVendorDto) {
    const [vendor] = await this.nodeKnex('vendor')
      .insert({
        vendor_name: addVendorDto.vendor_name,
      })
      .returning('*');
    return { vendor };
  }

  async updateVendor(vendorId: string, addVendorDto: AddVendorDto) {
    const [vendor] = await this.nodeKnex('vendor')
      .update({
        vendor_name: addVendorDto.vendor_name,
      })
      .where({
        vendor_id: vendorId,
      })
      .returning('*');
    if (!vendor) {
      throw new BadRequestException('Not found');
    }
    return { vendor };
  }

  async getVendorSettings(vendorId: string) {
    const vendor_pool_admins = await this.nodeKnex('vendor_pool_admin')
      .select([
        '*',
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('vendor_pool_admin.revshare_wallet_id') })
          .as('revshare_wallet'),
        this.nodeKnex('wallet')
          .first(this.nodeKnex.raw(`row_to_json(wallet.*)`))
          .where({ wallet_id: this.nodeKnex.ref('vendor_pool_admin.reward_sweep_wallet_id') })
          .as('reward_sweep_wallet'),
      ])
      .where({
        vendor_id: vendorId,
      });
    return { vendor_pool_admins };
  }

  private checkAddVendorSettingDto(addVendorSettingDto: AddVendorSettingDto) {
    if (addVendorSettingDto.deduct_revshare) {
      if (typeof addVendorSettingDto.rev_share_rate !== 'number') {
        throw new BadRequestException('rev_share_rate required');
      }
      if (!addVendorSettingDto.rev_share_over) {
        throw new BadRequestException('rev_share_over required');
      }
      if (!addVendorSettingDto.revshare_wallet_id) {
        throw new BadRequestException('revshare_wallet_id required');
      }
    }
  }

  async addVendorSetting(addVendorSettingDto: AddVendorSettingDto) {
    this.checkAddVendorSettingDto(addVendorSettingDto);

    const [vendor_pool_admin] = await this.nodeKnex('vendor_pool_admin')
      .insert({
        ...addVendorSettingDto,
      })
      .returning('*');
    return { vendor_pool_admin };
  }

  async updateVendorSetting(addVendorSettingDto: AddVendorSettingDto) {
    this.checkAddVendorSettingDto(addVendorSettingDto);

    const [vendor_pool_admin] = await this.nodeKnex('vendor_pool_admin')
      .update({
        admin_email: null,
        rev_share_rate: null,
        rev_share_over: null,
        revshare_wallet_id: null,
        ...addVendorSettingDto,
      })
      .where({
        vendor_id: addVendorSettingDto.vendor_id,
        pool_id: addVendorSettingDto.pool_id,
      })
      .returning('*');

    if (!vendor_pool_admin) {
      throw new BadRequestException('Not found');
    }
    return { vendor_pool_admin };
  }
}
