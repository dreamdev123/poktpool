import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class QueryPricingModelsDto {
  @ApiProperty()
  @IsString()
  readonly network_id: string;

  @ApiProperty()
  @IsString()
  readonly vendor_id: string;
}
