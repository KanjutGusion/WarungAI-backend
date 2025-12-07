import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { ParsedItemDto } from './parsed-item.dto';

export class ParsedNotaDto {
  @ApiProperty({
    type: () => [ParsedItemDto],
    description: 'The list of parsed items from the nota.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParsedItemDto)
  items: ParsedItemDto[];

  @ApiProperty({
    description: 'The total amount.',
    example: 30000,
  })
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'The raw text extracted from the OCR.',
  })
  @IsString()
  rawText: string;
}
