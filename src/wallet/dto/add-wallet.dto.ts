import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, IsOptional, IsString, Length } from 'class-validator';

export class AddWalletDto {
  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description: 'wallet address',
  })
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly walletAddress: string;

  @ApiProperty({
    description: 'nickname',
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly nickname?: string;
}
