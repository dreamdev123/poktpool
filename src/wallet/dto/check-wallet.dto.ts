import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, Length } from 'class-validator';

export class CheckWalletDto {
  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description: 'wallet address',
  })
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly walletAddress: string;
}
