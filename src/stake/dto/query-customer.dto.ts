import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, IsNotEmpty, Length } from 'class-validator';

export class QueryCustomerDto {
  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description: 'wallet address',
  })
  @IsNotEmpty()
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly walletId: string;
}
