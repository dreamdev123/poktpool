import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TxnTypeCategory } from '../admin.bonus.enum';

export class QueryTransactionsDto {
  @ApiProperty()
  @IsString()
  readonly txn_type_code: string;
}
