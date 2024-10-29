import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class DistributePostTrancheDto {
  @ApiProperty()
  @IsNumber()
  readonly trancheId: number;
}
