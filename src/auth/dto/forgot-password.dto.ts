import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;
}
