import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class AdminRoleAddRoleDto {
  @ApiProperty()
  @IsNumber()
  readonly pool_id: number;

  @ApiProperty()
  @IsString()
  readonly role_name: string;
}
