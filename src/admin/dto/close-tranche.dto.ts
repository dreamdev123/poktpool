import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CloseTrancheDto {
  @ApiProperty({
    description: 'Tranche ID to close',
  })
  @IsNumber()
  readonly tranche_to_close: number;

  @ApiProperty({
    description: 'rewards amount as POKT',
  })
  @IsNumber()
  readonly rewards: number;

  @ApiProperty({
    description: 'infra_discount',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  readonly infra_discount?: number;

  @ApiProperty({
    description: 'Active days',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  readonly activedays?: number;

  @ApiProperty({
    description: 'Unstake cooldown',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  readonly unstakecooldown?: number;
}
