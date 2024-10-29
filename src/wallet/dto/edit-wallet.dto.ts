import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EditWalletDto {
  @ApiProperty({
    description: 'nickname',
  })
  @IsString()
  readonly nickname: string;
}
