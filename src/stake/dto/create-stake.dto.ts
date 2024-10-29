import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateStakeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsHexadecimal()
  @Length(64, 64)
  readonly txId: string;

  @ApiProperty({
    description: "'manual' or 'wallet_integration'",
  })
  @IsString()
  readonly stake_method: string;
}
