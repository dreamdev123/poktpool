import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsAscii, IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateUsernameDto {
  @ApiProperty({ minimum: 5, maximum: 32 })
  @IsNotEmpty()
  @Length(5, 32)
  @IsAscii()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly username: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsNotEmpty()
  @IsString()
  @Length(1)
  readonly password: string;
}
