import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsPositive, IsString, Max, Min } from 'class-validator';

export class CreatePricingModelDto {
  @ApiProperty()
  @IsNumber()
  readonly network_id: number;

  @ApiProperty()
  @IsNumber()
  readonly vendor_id: number;

  @ApiProperty()
  @IsString()
  readonly model_name: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  readonly fiat_per_node: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly rev_share_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  readonly tokens_per_node: number;
}
