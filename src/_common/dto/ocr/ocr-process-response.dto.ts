import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OcrItemDto } from './ocr-item.dto';

export class OcrProcessResponseDto {
  @ApiProperty({
    description: 'List of parsed items from the receipt',
    type: [OcrItemDto],
  })
  @Type(() => OcrItemDto)
  items: OcrItemDto[];

  @ApiProperty({
    description: 'Total amount of the sale',
    example: 39220,
  })
  total: number;

  @ApiProperty({
    description: 'Calculated profit from the sale',
    example: 7844,
  })
  profit: number;

  @ApiProperty({
    description: 'Additional summary data',
    example: {},
    type: 'object',
    additionalProperties: true,
  })
  summary: Record<string, any>;
}
