import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminRoleQueryUserDto {
  @ApiProperty({
    description: 'username',
    required: true,
  })
  @IsString()
  @MinLength(3)
  readonly username: string;
}
