import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsAscii, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @ApiProperty()
  @IsNumber({}, { each: true })
  @IsArray()
  readonly contact_type_ids: number[];
}
