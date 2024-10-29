import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsAscii, IsEmail, IsHexadecimal, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Unique } from 'typeorm';

@Unique(['username'])
export class UserMatchSignupDto {
  @ApiProperty({ minimum: 5, maximum: 32 })
  @Length(5, 32)
  @IsAscii()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly username?: string;

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
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email?: string;

  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description:
      'This is the Primary Wallet you will perform all transactions from, it must be a valid 40 character hexidecimal address',
  })
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly primaryWalletId?: string;

  @ApiProperty({
    minimum: 8,
    maximum: 64,
    description:
      'Password must contain 1 upper case character, 1 lower case character, 1 special character, and 1 number',
  })
  @IsString()
  @Length(8, 64)
  @Matches(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/, {
    message:
      'Password must be 8 characters in length, have 1 Upper Case character, 1 lower case character, and 1 special character',
  })
  readonly password?: string;
}
