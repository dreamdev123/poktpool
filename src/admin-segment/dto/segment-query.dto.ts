import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SegmentQueryDto {
  @ApiProperty({
    description: 'Pool ID',
    required: true,
  })
  @IsString()
  readonly pool_id: string;
}
