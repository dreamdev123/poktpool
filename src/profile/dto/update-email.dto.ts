import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateEmailDto {
  @ApiProperty({
    description: 'Email',
  })
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsNotEmpty()
  @IsString()
  @Length(1)
  readonly password: string;
}
