import { ApiProperty } from '@nestjs/swagger';

export class PricingRecommendationDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Indomie Goreng',
  })
  item_name: string;

  @ApiProperty({
    description: 'Current average selling price',
    example: 3000,
  })
  current_price: number;

  @ApiProperty({
    description: 'Recommended selling price',
    example: 3500,
  })
  recommended_price: number;

  @ApiProperty({
    description: 'Expected profit margin percentage',
    example: 25,
  })
  expected_margin: number;

  @ApiProperty({
    description: 'Reasoning for the recommendation',
    example: 'Based on market trends and your profit goals',
  })
  reasoning: string;
}
