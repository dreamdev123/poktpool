import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    minimum: 8,
    maximum: 64,
    description:
      'Password must contain 1 upper case character, 1 lower case character, 1 special character, and 1 number',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 64)
  @Matches(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/, {
    message:
      'Password must be 8 characters in length, have 1 upper Case character, 1 lower case character, 1 number and 1 special character',
  })
  readonly password: string;
}
