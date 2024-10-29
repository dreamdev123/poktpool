import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString } from 'class-validator';

export class FilterNodesDto {
  @ApiProperty({
    description: 'Pool ID',
  })
  @IsNumberString()
  readonly poolId: number;

  @ApiProperty({
    description: 'Vendor ID',
  })
  @IsNumberString()
  readonly vendorId: number;
}
