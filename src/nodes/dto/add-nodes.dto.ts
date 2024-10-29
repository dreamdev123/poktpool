import { ApiProperty } from '@nestjs/swagger';
import { IsHexadecimal, IsNotEmpty, IsNumber, IsString, Length } from 'class-validator';

export class AddNodesDto {
  @ApiProperty({
    description: 'Node address',
  })
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  @Length(40, 40, { each: true })
  @IsHexadecimal({ each: true })
  readonly nodeAddresses: string[];

  @ApiProperty({
    description: 'Pool ID',
  })
  @IsNumber()
  readonly poolId: number;

  @ApiProperty({
    description: 'Vendor ID',
  })
  @IsNumber()
  readonly vendorId: number;
}
