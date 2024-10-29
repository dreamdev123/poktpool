import { ApiProperty } from '@nestjs/swagger';
import { IsAscii, IsNotEmpty, IsString, Length } from 'class-validator';

export class SubmitTxDto {
  @ApiProperty()
  @IsString()
  readonly address: string;

  @ApiProperty()
  @IsString()
  readonly raw_hex_bytes: string;
}
