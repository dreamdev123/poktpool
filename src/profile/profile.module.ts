import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { PoktPoolUser } from 'src/auth/entities/user.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PoktPoolUser]), JwtModule.register({})],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
