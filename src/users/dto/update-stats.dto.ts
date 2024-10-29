import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, IsNumber, Length } from 'class-validator';

export class UpdateStatsDto {
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
    description: 'This is the total sweeps performed by the user',
  })
  @IsNumber()
  readonly sweepsPerformed?: number;

  @ApiProperty({
    description: 'This is the total of sweeps performed by the user',
  })
  @IsNumber()
  readonly sweepTotal?: number;

  @ApiProperty({
    description: 'This is the total upokt staked by the user',
  })
  @IsNumber()
  readonly uPoktStaked?: number;

  @ApiProperty({
    description: 'This is the current earnings for the reward period - gross',
  })
  @IsNumber()
  readonly currentTotalEarnings?: number;

  @ApiProperty({
    description: 'This is the total unstakes performed by the user',
  })
  @IsNumber()
  readonly unstakesPerformed?: number;

  @ApiProperty({
    description: 'This is the total of unstakes performed by the user',
  })
  @IsNumber()
  readonly unstakesTotal?: number;
}
