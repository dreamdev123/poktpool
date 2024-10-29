import { InjectKnex, Knex } from 'nestjs-knex';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as sgMail from '@sendgrid/mail';
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';
import { UpdateUsernameDto } from '../dto/update-username.dto';
import { UpdateEmailDto } from '../dto/update-email.dto';
import EmailChangeJWTPayload from 'src/email-confirm/interfaces/email-change-jwt-payload.interface';
import { EMAIL_TEMPLATE } from 'src/constants';

@Injectable()
export class ProfileService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(PoktPoolUser)
    private readonly poktPoolUsersRepository: Repository<PoktPoolUser>,
    @InjectKnex() private readonly knex: Knex,
  ) {}

  async updateUsername(updateUsernameDto: UpdateUsernameDto, poktPoolUser: PoktPoolUser) {
    const passwordCheck = await poktPoolUser.validatePassword(
      updateUsernameDto.password,
      poktPoolUser.password,
    );
    if (!passwordCheck) {
      throw new BadRequestException('Wrong password');
    }

    const existing = await this.poktPoolUsersRepository.findOne({
      where: { username: updateUsernameDto.username },
    });
    if (existing && existing.id !== poktPoolUser.id) {
      throw new BadRequestException('Username already exists');
    }

    poktPoolUser.username = updateUsernameDto.username;
    await this.poktPoolUsersRepository.save(poktPoolUser);
  }

  async updateEmail(updateEmailDto: UpdateEmailDto, poktPoolUser: PoktPoolUser) {
    if (updateEmailDto.email === poktPoolUser.email) {
      return;
    }

    const passwordCheck = await poktPoolUser.validatePassword(updateEmailDto.password, poktPoolUser.password);
    if (!passwordCheck) {
      throw new BadRequestException('Wrong password');
    }

    const existing = await this.poktPoolUsersRepository.findOne({ where: { email: updateEmailDto.email } });
    if (existing && existing.id !== poktPoolUser.id) {
      throw new BadRequestException('Email already exists');
    }

    const payload: EmailChangeJWTPayload = {
      email: updateEmailDto.email,
      userId: poktPoolUser.id,
    };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_SECRET'),
      expiresIn: `${this.configService.get('JWT_EMAIL_VERIFICATION_TOKEN_EXPIRY')}s`,
    });
    const verificationUrl = `${this.configService.get('frontend')}/update-email?token=${token}`;

    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    await sgMail.send({
      to: updateEmailDto.email,
      from: this.configService.get('fromEmail'),
      templateId: EMAIL_TEMPLATE.EMAIL_CHANGE_CONFIRM,
      dynamicTemplateData: {
        username: poktPoolUser.username,
        url: verificationUrl,
      },
    });
  }

  async updateContactInfo(updateContactInfoDto: UpdateContactInfoDto, poktPoolUser: PoktPoolUser) {
    if (Object.keys(updateContactInfoDto).length === 0) return;

    const KEY_TO_ID = {
      discord: 1,
      telegram: 2,
      twitter: 3,
      phone: 4,
    };
    const data = Object.keys(updateContactInfoDto).map((key) => ({
      user_id: poktPoolUser.id,
      channel_id: KEY_TO_ID[key],
      contact_details: updateContactInfoDto[key],
    }));
    await this.knex('user_contact').insert(data).onConflict(['user_id', 'channel_id']).merge();
  }

  async getContactInfo(poktPoolUser: PoktPoolUser) {
    const ID_TO_KEY = {
      1: 'discord',
      2: 'telegram',
      3: 'twitter',
      4: 'phone',
    };
    const data = await this.knex('user_contact').select('*').where({ user_id: poktPoolUser.id });
    return data.reduce(
      (agg, record) =>
        Object.assign(agg, {
          [ID_TO_KEY[record.channel_id]]: record.contact_details,
        }),
      {},
    );
  }

  async updateUserPhoto(file, poktPoolUser: PoktPoolUser) {
    const s3 = new AWS.S3({
      endpoint: 'https://ewr1.vultrobjects.com',
      accessKeyId: this.configService.getOrThrow('S3_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow('S3_SECRET_ACCESS_KEY'),
    });
    const result = await s3
      .upload({
        ACL: 'public-read',
        Bucket: this.configService.getOrThrow('vultrBucket'),
        Key: `profile-image/${poktPoolUser.id}/${file.filename}`,
        Body: fs.readFileSync(file.path),
        ContentType: file.mimetype,
      })
      .promise();
    fs.rmSync(file.path);

    poktPoolUser.userIconUrl = result.Location;
    await this.poktPoolUsersRepository.save(poktPoolUser);

    return {
      userIconUrl: poktPoolUser.userIconUrl,
    };
  }

  async deleteUserPhoto(poktPoolUser: PoktPoolUser) {
    poktPoolUser.userIconUrl = null;
    await this.poktPoolUsersRepository.save(poktPoolUser);
  }
}
