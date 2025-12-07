import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/_common/prisma/prisma.service';
import { SalesSummaryDto } from 'src/_common/dto/analytics/sales-summary.dto';
import { TopItemDto } from 'src/_common/dto/analytics/top-item.dto';
import { Prisma } from 'src/generated/prisma/client';

interface RecentSaleItem {
  name: string;
  qty: number;
  subtotal: number;
}

interface RecentSale {
  id: string;
  createdAt: Date;
  itemCount: number;
  totalAmount: number;
  profit: number;
  items: RecentSaleItem[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSalesSummary(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SalesSummaryDto> {
    const whereClause: Prisma.SaleWhereInput = {};

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
    exportData: boolean = false,
  ): Promise<TopItemDto[]> {
    const whereClause: Prisma.ItemWhereInput = {};

    if (userId) {
      whereClause.session = { userId };
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const aggregatedItems = await this.prismaService.item.groupBy({
      by: ['name'],
      where: whereClause,
      _sum: {
        qty: true,
        subtotal: true,
      },
      _count: {
        name: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      ...(exportData ? {} : { take: limit }),
    });

    const topItems: TopItemDto[] = aggregatedItems.map((item) => ({
      name: item.name,
      total_qty: item._sum.qty || 0,
      total_revenue: item._sum.subtotal?.toNumber() || 0,
      frequency: item._count.name,
    }));

    return topItems;
  }

  async getRecentSales(
    userId?: string,
    limit: number = 10,
    exportData: boolean = false,
  ): Promise<RecentSale[]> {
    const whereClause: Prisma.SessionWhereInput = {};

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
      ...(exportData ? {} : { take: limit }),
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
