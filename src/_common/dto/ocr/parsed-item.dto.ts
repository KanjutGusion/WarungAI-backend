import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ParsedItemDto {
  @ApiProperty({
    description: 'The name of the item.',
    example: 'Product A',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The quantity of the item.',
    example: 2,
  })
  @IsNumber()
  qty: number;

  @ApiProperty({
    description: 'The price of the item.',
    example: 15000,
  })
  @IsNumber()
  price: number;
}
