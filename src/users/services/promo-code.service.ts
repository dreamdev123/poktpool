import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectKnex, Knex } from 'nestjs-knex';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PoktPoolUser } from '../../auth/entities/user.entity';
import { SubmitPromoCodeDto } from '../dto/submit-promo-code.dto';

@Injectable()
export class PromoCodeService {
  constructor(
    private readonly configService: ConfigService,
    @InjectKnex() private readonly knex: Knex,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
  ) {}

  async submitPromoCode(poktPoolUser: PoktPoolUser, submitPromoCodeDto: SubmitPromoCodeDto) {
    const promoItem = await this.knex('promo_code').first('*').where({
      promo_code: submitPromoCodeDto.code,
    });
    if (!promoItem) {
      throw new BadRequestException('Invalid promo code');
    }

    if (new Date(promoItem.promo_end_dt) < new Date()) {
      throw new BadRequestException('This promotion has expired!');
    }
    if (new Date(promoItem.promo_start_dt) > new Date()) {
      throw new BadRequestException('Invalid promo code');
    }

    const alreadyExists = await this.knex('user_promo_optin').first('*').where({
      promo_id: promoItem.promo_id,
      user_id: poktPoolUser.id,
    });
    if (alreadyExists) {
      throw new BadRequestException('You are already signed up for this promotion');
    }

    await this.knex('user_promo_optin').insert({
      promo_id: promoItem.promo_id,
      user_id: poktPoolUser.id,
    });
  }

  async getPromotions(poktPoolUser: PoktPoolUser) {
    const data = await this.knex('vw_active_promo_optins').select('*').where({
      user_id: poktPoolUser.id,
    });
    return data;
  }
}
