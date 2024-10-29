import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminRoleAddUserDto {
  @ApiProperty({
    description: 'username',
    required: true,
  })
  @IsString()
  readonly username: string;
}
