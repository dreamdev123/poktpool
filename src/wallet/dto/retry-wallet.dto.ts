import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RetryWalletDto {
  @ApiProperty({
    description: 'verf_req_id',
  })
  @IsString()
  readonly verf_req_id: string;
}
