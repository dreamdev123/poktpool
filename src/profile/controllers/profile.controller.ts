import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { GetPoktPoolUser } from 'src/auth/decorator/get-user.decorator';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { diskStorage } from 'multer';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { ProfileService } from '../services/profile.service';
import { UpdateUsernameDto } from '../dto/update-username.dto';
import { UpdateContactInfoDto } from '../dto/update-contact-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UpdateEmailDto } from '../dto/update-email.dto';

@ApiTags('PoktPool user profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtTwoFactorGuard)
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Patch('/username')
  async updateUsername(
    @Body() updateUsernameDto: UpdateUsernameDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    return this.profileService.updateUsername(updateUsernameDto, poktPoolUser);
  }

  @Patch('/email')
  async updateEmail(@Body() updateEmailDto: UpdateEmailDto, @GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.profileService.updateEmail(updateEmailDto, poktPoolUser);
  }

  @Get('/contact-info')
  async getContactInfo(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.profileService.getContactInfo(poktPoolUser);
  }

  @Put('/contact-info')
  async updateContactInfo(
    @Body() updateContactInfoDto: UpdateContactInfoDto,
    @GetPoktPoolUser() poktPoolUser: PoktPoolUser,
  ) {
    return this.profileService.updateContactInfo(updateContactInfoDto, poktPoolUser);
  }

  @Put('/photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!extname(file.originalname).match(/\.(jpg|jpeg|png|gif)$/)) {
          callback(new HttpException('You can only upload image files', HttpStatus.BAD_REQUEST), false);
        } else {
          callback(null, true);
        }
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, './uploads');
        },
        filename: (_req, file, callback) => {
          const fileExtName = extname(file.originalname);
          callback(null, uuidv4() + fileExtName);
        },
      }),
    }),
  )
  updateUserPhoto(@UploadedFile() file, @GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.profileService.updateUserPhoto(file, poktPoolUser);
  }

  @Delete('/photo')
  async deleteUserPhoto(@GetPoktPoolUser() poktPoolUser: PoktPoolUser) {
    return this.profileService.deleteUserPhoto(poktPoolUser);
  }
}
