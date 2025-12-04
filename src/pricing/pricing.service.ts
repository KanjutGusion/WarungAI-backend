import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/_common/prisma/prisma.service';
import { AiService } from 'src/_common/ai/ai.service';
import { PricingRecommendationDto } from 'src/_common/dto/pricing/pricing-recommendation.dto';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Get pricing recommendations for items
   * This is a simplified version - in production, this would integrate with AI models
   */
  async getPricingRecommendations(
    userId?: string,
    targetMargin: number = 25,
  ): Promise<PricingRecommendationDto[]> {
    // Get all items for the user
    const whereClause: any = {};
    if (userId) {
      whereClause.session = { userId };
    }

    const items = await this.prismaService.item.findMany({
      where: whereClause,
      select: {
        name: true,
        unitPrice: true,
        subtotal: true,
        qty: true,
      },
    });

    // Group by item name and calculate averages
    const itemMap = new Map<
      string,
      { totalPrice: number; count: number; avgQty: number }
    >();

    items.forEach((item) => {
      const existing = itemMap.get(item.name) || {
        totalPrice: 0,
        count: 0,
        avgQty: 0,
      };
      itemMap.set(item.name, {
        totalPrice: existing.totalPrice + item.subtotal.toNumber(),
        count: existing.count + 1,
        avgQty: existing.avgQty + item.qty,
      });
    });

    // Generate recommendations with AI
    const recommendationPromises = Array.from(itemMap.entries()).map(
      async ([itemName, data]) => {
        const avgPrice = data.totalPrice / data.count;

        try {
          // Use AI for intelligent pricing recommendation
          const aiRecommendation =
            await this.aiService.generatePricingRecommendation(
              itemName,
              avgPrice,
              {
                total_qty: data.avgQty,
                total_revenue: data.totalPrice,
                frequency: data.count,
              },
              targetMargin,
            );

          return {
            item_name: itemName,
            current_price: Math.round(avgPrice),
            recommended_price: aiRecommendation.recommended_price,
            expected_margin: targetMargin,
            reasoning: aiRecommendation.reasoning,
            frequency: data.count,
          };
        } catch (error) {
          this.logger.error(
            `AI pricing failed for ${itemName}, using fallback`,
            error,
          );

          // Fallback to simple calculation if AI fails
          const estimatedCost = avgPrice / (1 + 0.2);
          const recommendedPrice = estimatedCost * (1 + targetMargin / 100);

          return {
            item_name: itemName,
            current_price: Math.round(avgPrice),
            recommended_price: Math.round(recommendedPrice),
            expected_margin: targetMargin,
            reasoning: this.generateReasoning(
              avgPrice,
              recommendedPrice,
              targetMargin,
              data.count,
            ),
            frequency: data.count,
          };
        }
      },
    );

    const recommendations = await Promise.all(recommendationPromises);

    // Sort by frequency (most sold items first)
    return recommendations.sort((a, b) => b.frequency - a.frequency);
  }

  private generateReasoning(
    currentPrice: number,
    recommendedPrice: number,
    targetMargin: number,
    frequency: number,
  ): string {
    const priceDiff = recommendedPrice - currentPrice;
    const percentChange = (priceDiff / currentPrice) * 100;

    if (Math.abs(percentChange) < 5) {
      return `Your current pricing is optimal for a ${targetMargin}% profit margin. Sold ${frequency} times.`;
    } else if (percentChange > 0) {
      return `Consider increasing price by ${Math.round(percentChange)}% to achieve ${targetMargin}% margin. This item has been sold ${frequency} times, indicating good demand.`;
    } else {
      return `You can reduce price by ${Math.round(Math.abs(percentChange))}% while maintaining ${targetMargin}% margin, potentially increasing sales volume. Current sales: ${frequency} transactions.`;
    }
  }

  /**
   * Get pricing recommendation for a specific item
   */
  async getItemPricingRecommendation(
    itemName: string,
    userId?: string,
    targetMargin: number = 25,
  ): Promise<PricingRecommendationDto | null> {
    const recommendations = await this.getPricingRecommendations(
      userId,
      targetMargin,
    );
    return (
      recommendations.find(
        (r) => r.item_name.toLowerCase() === itemName.toLowerCase(),
      ) || null
    );
  }
}
