import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class ProcessCommitDto {
  @ApiProperty()
  @IsNumber()
  readonly sale_commit_id: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  readonly amount: number;
}
