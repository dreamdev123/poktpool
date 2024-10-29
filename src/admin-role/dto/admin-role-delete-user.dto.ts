import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminRoleDeleteUserDto {
  @ApiProperty({
    description: 'User ID',
    required: true,
  })
  @IsString()
  readonly user_id: string;
}
