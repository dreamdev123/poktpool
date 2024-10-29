import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class SubmitPaymentDto {
  @ApiProperty()
  @IsNumber()
  readonly sale_commit_id: number;

  @ApiProperty({
    description: '4 for USDC, 5 for USDT',
  })
  @IsNumber()
  readonly payment_currency_code: number;

  @ApiProperty()
  @IsString()
  readonly payment_txn_hash: number;
}
