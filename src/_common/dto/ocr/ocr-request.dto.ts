import { ApiProperty } from '@nestjs/swagger';

export class OcrRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file of the receipt to be processed.',
  })
  image: File;
}
