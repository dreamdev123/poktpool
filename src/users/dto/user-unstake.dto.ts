import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, IsNotEmpty, IsString, Length, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class UnstakeConfirmDto {
  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description:
      'This is the Primary Wallet you will perform all transactions from, it must be a valid 40 character hexidecimal address',
  })
  @IsNotEmpty()
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly primaryWalletId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly twoFactorCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly oneTimeCode?: string;

  @ApiProperty({
    description: 'Unstaking percent',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  readonly unstakingPercent: number;

  @ApiProperty({
    description: 'POKT amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  readonly unstakingAmount: number;
}
