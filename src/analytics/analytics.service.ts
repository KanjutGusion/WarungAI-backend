import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/_common/prisma/prisma.service';
import { SalesSummaryDto } from 'src/_common/dto/analytics/sales-summary.dto';
import { TopItemDto } from 'src/_common/dto/analytics/top-item.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getSalesSummary(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SalesSummaryDto> {
    const whereClause: any = {};

    if (userId) {
      whereClause.session = { userId };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const sales = await this.prismaService.sale.findMany({
      where: whereClause,
      select: {
        totalAmount: true,
        profit: true,
        profitMargin: true,
      },
    });

    if (sales.length === 0) {
      return {
        total_sales: 0,
        total_profit: 0,
        avg_profit_margin: 0,
        transaction_count: 0,
        avg_transaction_value: 0,
      };
    }

    const totalSales = sales.reduce(
      (sum, sale) => sum + sale.totalAmount.toNumber(),
      0,
    );
    const totalProfit = sales.reduce(
      (sum, sale) => sum + sale.profit.toNumber(),
      0,
    );
    const avgProfitMargin =
      sales.reduce(
        (sum, sale) => sum + (sale.profitMargin?.toNumber() || 0),
        0,
      ) / sales.length;

    return {
      total_sales: totalSales,
      total_profit: totalProfit,
      avg_profit_margin: Math.round(avgProfitMargin * 100) / 100,
      transaction_count: sales.length,
      avg_transaction_value:
        Math.round((totalSales / sales.length) * 100) / 100,
    };
  }

  async getTopItems(
    userId?: string,
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TopItemDto[]> {
    const whereClause: any = {};

    if (userId) {
      whereClause.session = { userId };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const items = await this.prismaService.item.findMany({
      where: whereClause,
      select: {
        name: true,
        qty: true,
        subtotal: true,
      },
    });

    // Group by item name
    const itemMap = new Map<
      string,
      { totalQty: number; totalRevenue: number; frequency: number }
    >();

    items.forEach((item) => {
      const existing = itemMap.get(item.name) || {
        totalQty: 0,
        totalRevenue: 0,
        frequency: 0,
      };
      itemMap.set(item.name, {
        totalQty: existing.totalQty + item.qty,
        totalRevenue: existing.totalRevenue + item.subtotal.toNumber(),
        frequency: existing.frequency + 1,
      });
    });

    // Convert to array and sort by revenue
    const topItems: TopItemDto[] = Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name,
        total_qty: data.totalQty,
        total_revenue: data.totalRevenue,
        frequency: data.frequency,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return topItems;
  }

  async getRecentSales(userId?: string, limit: number = 10) {
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    const sessions = await this.prismaService.session.findMany({
      where: whereClause,
      include: {
        items: true,
        sale: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      itemCount: session.items.length,
      totalAmount: session.sale?.totalAmount.toNumber() || 0,
      profit: session.sale?.profit.toNumber() || 0,
      items: session.items.map((item) => ({
        name: item.name,
        qty: item.qty,
        subtotal: item.subtotal.toNumber(),
      })),
    }));
  }
}
