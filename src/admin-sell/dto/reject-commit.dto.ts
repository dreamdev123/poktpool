import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RejectCommitDto {
  @ApiProperty()
  @IsNumber()
  readonly sale_commit_id: number;
}
