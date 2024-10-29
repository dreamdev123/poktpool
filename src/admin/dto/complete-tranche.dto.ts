import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CompleteTrancheDto {
  @ApiProperty()
  @IsNumber()
  readonly trancheId: number;
}
