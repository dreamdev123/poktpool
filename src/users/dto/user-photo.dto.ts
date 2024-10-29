import { ApiProperty } from '@nestjs/swagger';

export class UserPhotoDto {
  @ApiProperty({
    type: 'file',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
    required: false,
  })
  photo: string;

  @ApiProperty({
    required: false,
  })
  modifiedPhoto: string;
}
