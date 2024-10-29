import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class MemberLookupDto {
  @ApiProperty({
    description: 'Email',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  readonly email?: string;

  @ApiProperty({
    description: 'Username',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  readonly username?: string;

  @ApiProperty({
    description: 'Wallet address',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  readonly wallet?: string;

  @ApiProperty({
    description: 'Discord handle',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  readonly discord?: string;
}
