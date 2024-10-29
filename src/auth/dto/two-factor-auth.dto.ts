import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class TwoFactorAuthDto {
  @ApiProperty({
    maxLength: 6,
    minLength: 6,
    description: 'Provide a unique 6 digit key to encrypt your two factor session',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  readonly twoFactorCode?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly backupCode?: string;
}
