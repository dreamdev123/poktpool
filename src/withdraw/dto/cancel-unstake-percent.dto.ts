import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CancelUnstakeDto {
  @ApiProperty({
    description: 'Unstake request id',
  })
  @IsNumber()
  readonly unstake_req_id: number;
}
