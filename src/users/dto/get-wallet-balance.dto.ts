import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class GetWalletBalanceDto {
  @ApiProperty()
  @Length(40, 40)
  @IsString()
  readonly address: string;
}
