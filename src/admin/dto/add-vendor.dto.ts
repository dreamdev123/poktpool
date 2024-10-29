import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddVendorDto {
  @ApiProperty()
  @IsString()
  readonly vendor_name: string;
}
