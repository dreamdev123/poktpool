import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsAscii, IsNotEmpty, Length } from 'class-validator';

export class UpdateUserInfoDto {
  @ApiProperty({ minimum: 5, maximum: 32 })
  @IsNotEmpty()
  @Length(5, 32)
  @IsAscii()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly username?: string;
}
