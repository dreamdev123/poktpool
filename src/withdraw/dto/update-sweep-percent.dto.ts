import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsInt } from 'class-validator';

export class UpdateSweepPercentDto {
  @ApiProperty({
    description: 'Sweep percent value',
  })
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(100)
  readonly sweepPercent: number;
}
