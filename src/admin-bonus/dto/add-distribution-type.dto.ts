import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { TxnTypeCategory } from '../admin.bonus.enum';

export class AddDistributionTypeDto {
  @ApiProperty()
  @IsString()
  @IsEnum(TxnTypeCategory)
  readonly txn_type_category: TxnTypeCategory;

  @ApiProperty()
  @IsString()
  readonly txn_type_desc: string;
}
