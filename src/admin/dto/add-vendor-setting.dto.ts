import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class AddVendorSettingDto {
  @ApiProperty()
  @IsNumber()
  readonly vendor_id: number;

  @ApiProperty()
  @IsNumber()
  readonly pool_id: number;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly admin_email: string;

  @ApiProperty()
  @IsNumber()
  readonly base_node_fee: number;

  @ApiProperty()
  @IsString()
  @IsIn(['Daily', 'Monthly', 'Staked Token'])
  readonly fee_frequency: string;

  @ApiProperty({
    required: false,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  readonly rev_share_rate: number;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsIn(['Zero', 'Network Average'])
  readonly rev_share_over: string;

  @ApiProperty()
  @IsString()
  readonly reward_sweep_wallet_id: string;

  @ApiProperty({
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly revshare_wallet_id: string;

  @ApiProperty()
  @IsBoolean()
  readonly is_custodial: boolean;

  @ApiProperty()
  @IsBoolean()
  readonly deduct_revshare: boolean;

  @ApiProperty()
  @IsBoolean()
  readonly is_active: boolean;
}
