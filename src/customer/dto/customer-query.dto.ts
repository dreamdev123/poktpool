import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CustomerQueryDto {
  @ApiProperty({
    description: 'CustomerId',
    required: true,
  })
  @IsString()
  readonly customerId: string;
}