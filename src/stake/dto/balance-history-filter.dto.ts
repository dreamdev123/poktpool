import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional } from 'class-validator';

export class BalanceHistoryFilterDto {
  @ApiProperty({
    description: 'CustomerId',
    required: true,
  })
  @IsString()
  readonly customerId: string;

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
