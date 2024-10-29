import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class BalanceHistoryFilterDto {
  @ApiProperty({
    description: 'Start date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;

  @ApiProperty({
    description: 'End date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  readonly endDate?: string;
}
