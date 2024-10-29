import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsHexadecimal, IsNotEmpty, Length } from 'class-validator';
import { Unique } from 'typeorm';

export class ExistingStakeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsHexadecimal()
  @Length(64, 64)
  @Unique(['txId'])
  readonly txId: string;

  @ApiProperty({
    minimum: 40,
    maximum: 40,
    description:
      'This is the Primary Wallet you will perform all transactions from, it must be a valid 40 character hexidecimal address',
  })
  @IsNotEmpty()
  @IsHexadecimal()
  @Length(40, 40)
  @Transform(({ value }) => value.toUpperCase())
  readonly primaryWalletId: string;
}
