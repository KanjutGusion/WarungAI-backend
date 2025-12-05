import { ApiProperty } from '@nestjs/swagger';

export class TopItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Indomie Goreng',
  })
  name: string;

  @ApiProperty({
    description: 'Total quantity sold',
    example: 150,
  })
  total_qty: number;

  @ApiProperty({
    description: 'Total revenue from this item',
    example: 450000,
  })
  total_revenue: number;

  @ApiProperty({
    description: 'Number of times this item appeared',
    example: 45,
  })
  frequency: number;
}
