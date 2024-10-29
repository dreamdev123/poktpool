import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber, Max, Min, ValidateNested } from 'class-validator';

class PatchSegment {
  @ApiProperty()
  @IsNumber()
  readonly segment_id: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  readonly infra_rate: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(1)
  readonly ppinc_commission_rate: number;
}

export class PatchSegmentDto {
  @ApiProperty({
    isArray: true,
    type: PatchSegment,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PatchSegment)
  @ArrayNotEmpty()
  updates: PatchSegment[];
}
