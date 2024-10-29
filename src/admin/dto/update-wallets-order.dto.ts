import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray } from 'class-validator';

export class UpdateWalletsOrderDto {
  @ApiProperty()
  @IsString({ each: true })
  @IsArray()
  readonly walletIds: string[];
}
