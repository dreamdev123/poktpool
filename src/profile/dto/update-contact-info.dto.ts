import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateContactInfoDto {
  @ApiProperty({
    description: 'discord',
  })
  @IsOptional()
  @IsString()
  readonly discord?: string;

  @ApiProperty({
    description: 'telegram',
  })
  @IsOptional()
  @IsString()
  readonly telegram?: string;

  @ApiProperty({
    description: 'twitter',
  })
  @IsOptional()
  @IsString()
  readonly twitter?: string;

  @ApiProperty({
    description: 'phone',
  })
  @IsOptional()
  @IsString()
  readonly phone?: string;
}
