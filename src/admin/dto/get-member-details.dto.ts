import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetMemberDetailsDto {
  @ApiProperty()
  @IsString()
  readonly email: string;
}
