import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

export class EditAdminWallet {
  @ApiProperty({ required: true })
  @IsString()
  readonly wallet_id: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  readonly wallet_name?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  readonly is_active?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  readonly rpt_display?: boolean;
}

export class EditAdminWalletDto {
  @ApiProperty({
    isArray: true,
    type: EditAdminWallet,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditAdminWallet)
  @ArrayNotEmpty()
  updates: EditAdminWallet[];
}
