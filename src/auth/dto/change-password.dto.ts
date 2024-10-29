import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(8, 64)
  @Matches(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/, {
    message:
      'Password must be 8 characters in length, have 1 Upper Case character, 1 lower case character, and 1 special character',
  })
  readonly password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNotEmpty()
  @IsString()
  @Length(8, 64)
  @Matches(/^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/, {
    message:
      'Password must be 8 characters in length, have 1 Upper Case character, 1 lower case character, and 1 special character',
  })
  readonly newPassword?: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // readonly newPasswordToken: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNotEmpty()
  // @IsString()
  // @Length(8, 64)
  // @Matches(
  //   /^(?!.*\s)(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[~`!@#$%^&*()--+={}\[\]|\\:;"'<>,.?/_]).{8,69}$/,
  //   {
  //     message:
  //       'Password must be 8 characters in length, have 1 Upper Case character, 1 lower case character, and 1 special character',
  //   },
  // )
  // readonly currentPassword: string;
}
