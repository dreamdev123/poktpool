import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class HistoryQueryDto {
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
