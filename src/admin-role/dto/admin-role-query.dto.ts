import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AdminRoleQueryDto {
  @ApiProperty({
    description: 'Role ID',
    required: true,
  })
  @IsString()
  readonly role_id: string;
}
