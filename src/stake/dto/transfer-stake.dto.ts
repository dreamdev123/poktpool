import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  ValidateNested,
  ArrayNotEmpty,
  IsArray,
  IsPositive,
  IsString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { BalanceType } from '../enums/balance-type.enum';

class OneTransfer {
  @ApiProperty({
    description: 'To customer id',
  })
  @IsString()
  to_customer_id: string;

  @ApiProperty({
    description: 'Amount in POKT',
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Memo',
  })
  @IsString()
  @IsOptional()
  memo?: string;
}

export class TransferStakeDto {
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
    description: 'Balance type',
  })
  @IsEnum(BalanceType)
  balance_type: BalanceType;

  @ApiProperty({
    isArray: true,
    type: OneTransfer,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OneTransfer)
  @ArrayNotEmpty()
  list: OneTransfer[];
}
