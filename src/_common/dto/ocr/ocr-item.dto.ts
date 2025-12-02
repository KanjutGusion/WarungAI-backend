import { ApiProperty } from '@nestjs/swagger';

export class OcrItemDto {
  @ApiProperty({
    description: 'Name of the parsed item',
    example: 'Sewa Kursi',
  })
  name: string;

  @ApiProperty({
    description: 'Quantity of the parsed item',
    example: 1,
  })
  qty: number;

  @ApiProperty({
    description: 'Total price for the item line',
    example: 8000,
  })
  price: number;
}
