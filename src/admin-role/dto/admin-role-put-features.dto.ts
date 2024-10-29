import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AdminRolePutFeaturesDto {
  @ApiProperty()
  @IsNumber({}, { each: true })
  @IsArray()
  readonly feature_ids: number[];
}
