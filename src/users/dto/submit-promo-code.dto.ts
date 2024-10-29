import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsAscii, IsNotEmpty, IsString, Length } from 'class-validator';

export class SubmitPromoCodeDto {
  @ApiProperty()
  @IsString()
  @Transform(({ value }) => value.toUpperCase().trim())
  readonly code: string;
}
