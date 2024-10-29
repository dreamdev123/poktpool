import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class AdminRoleDeleteFeatureDto {
  @ApiProperty({
    description: 'Feature ID',
    required: true,
  })
  @IsNumber()
  readonly feature_id: number;
}
