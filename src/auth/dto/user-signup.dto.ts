import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsAscii,
  IsEmail,
  IsHexadecimal,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { Unique } from 'typeorm';

@Unique(['username', 'email'])
export class UserSignupDto {
  @ApiProperty({ minimum: 5, maximum: 32 })
  @IsNotEmpty()
  @Length(5, 32)
  @IsAscii()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly username: string;

  @ApiProperty({ minimum: 1, maximum: 255 })
  // @IsNotEmpty()
  @IsOptional()
  @Length(1, 255)
  @IsString()
  readonly firstName?: string;

  @ApiProperty({ minimum: 1, maximum: 255 })
  // @IsNotEmpty()
  @IsOptional()
  @Length(1, 255)
  @IsString()
  readonly lastName?: string;

  @ApiProperty({ description: 'Must be a valid email address' })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email: string;

  @ApiProperty({
    minimum: 8,
    maximum: 64,
    description:
      'Password must contain 1 upper case character, 1 lower case character, 1 special character, and 1 number',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 64)
  @Matches(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/, {
    message:
      'Password must be 8 characters in length, have 1 Upper Case character, 1 lower case character, and 1 special character',
  })
  readonly password: string;
}
