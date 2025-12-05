import { ApiProperty } from '@nestjs/swagger';

export class SalesSummaryDto {
  @ApiProperty({
    description: 'Total sales amount',
    example: 1500000,
  })
  total_sales: number;

  @ApiProperty({
    description: 'Total profit',
    example: 300000,
  })
  total_profit: number;

  @ApiProperty({
    description: 'Average profit margin percentage',
    example: 20,
  })
  avg_profit_margin: number;

  @ApiProperty({
    description: 'Number of transactions',
    example: 45,
  })
  transaction_count: number;

  @ApiProperty({
    description: 'Average transaction value',
    example: 33333.33,
  })
  avg_transaction_value: number;
}
