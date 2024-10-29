import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';

export class CommitBuyDto {
  @ApiProperty()
  @IsString()
  readonly xe_rate_id: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly token_amount: number;

  @ApiProperty({
    description: 'the value between 0 and 1',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly stake_percent: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly discord_handle: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly telegram_handle: string;
}
