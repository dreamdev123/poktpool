import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class VendorToAggregatedDto {
  @ApiProperty()
  @IsNumber()
  readonly blockId: number;

  @ApiProperty()
  @IsNumber()
  readonly trancheId: number;
}
