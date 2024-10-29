import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class SendBonusDto {
  @ApiProperty()
  @IsNumber()
  readonly pool_id: number;

  @ApiProperty()
  @IsNumber()
  readonly txn_type_code: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly amount: number;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly memo?: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsArray()
  readonly wallets: string[];
}
