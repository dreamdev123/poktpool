import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class AuthCredentialsDto {
  @ApiProperty({ minimum: 5, maximum: 32 })
  @IsNotEmpty()
  @IsString()
  @Length(5, 32)
  @Transform(({ value }) => value.toLowerCase().trim())
  username: string;

  @ApiProperty({
    minimum: 8,
    maximum: 64,
    description:
      'Password must contain 1 upper case character, 1 lower case character, 1 special character, and 1 number',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 64)
  readonly password: string;

  @ApiProperty({
    required: false,
    maxLength: 6,
    minLength: 6,
    description: 'Provide a unique 6 digit key to encrypt your two factor session',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  readonly twoFactorCode?: string;
}
