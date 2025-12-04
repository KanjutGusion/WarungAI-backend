import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { EUserRole } from 'src/types';
import type { ReqWithAuth } from 'src/types';
import { SalesSummaryDto } from 'src/_common/dto/analytics/sales-summary.dto';
import { TopItemDto } from 'src/_common/dto/analytics/top-item.dto';
import { AiService } from 'src/_common/ai/ai.service';
import { ExportService } from 'src/_common/export/export.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly aiService: AiService,
    private readonly exportService: ExportService,
  ) {}

  @Get('sales-summary')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get sales summary statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Sales summary retrieved successfully',
    type: SalesSummaryDto,
  })
  async getSalesSummary(
    @Req() req: ReqWithAuth,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SalesSummaryDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getSalesSummary(req.user?.id, start, end);
  }

  @Get('top-items')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get top selling items' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Top items retrieved successfully',
    type: [TopItemDto],
  })
  async getTopItems(
    @Req() req: ReqWithAuth,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TopItemDto[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getTopItems(
      req.user?.id,
      limitNum,
      start,
      end,
    );
  }

  @Get('recent-sales')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get recent sales transactions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Recent sales retrieved successfully',
  })
  async getRecentSales(
    @Req() req: ReqWithAuth,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getRecentSales(req.user?.id, limitNum);
  }

  @Get('market-insights')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get AI-powered market insights' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Market insights generated successfully',
  })
  async getMarketInsights(
    @Req() req: ReqWithAuth,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get sales data
    const salesSummary = await this.analyticsService.getSalesSummary(
      req.user?.id,
      start,
      end,
    );
    const topItems = await this.analyticsService.getTopItems(
      req.user?.id,
      10,
      start,
      end,
    );

    // Generate AI insights
    const insights = await this.aiService.generateMarketInsights(
      topItems,
      salesSummary,
    );

    return {
      insights,
      sales_summary: salesSummary,
      top_items: topItems.slice(0, 5),
    };
  }

  @Get('export/csv')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Export sales data to CSV' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportCSV(
    @Req() req: ReqWithAuth,
    @Res({ passthrough: true }) res: Response,
    @Query('limit') limit?: string,
  ): Promise<StreamableFile> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const salesData = await this.analyticsService.getRecentSales(
      req.user?.id,
      limitNum,
    );

    // Transform to match export format
    const data = salesData.map((sale) => ({
      id: sale.id,
      created_at: sale.createdAt,
      item_count: sale.itemCount,
      total_amount: sale.totalAmount,
      profit: sale.profit,
      items: sale.items,
    }));

    const buffer = await this.exportService.exportToCSV(data);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sales-export-${new Date().toISOString().split('T')[0]}.csv"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('export/excel')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Export sales data to Excel' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Excel file generated successfully',
  })
  async exportExcel(
    @Req() req: ReqWithAuth,
    @Res({ passthrough: true }) res: Response,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StreamableFile> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const salesData = await this.analyticsService.getRecentSales(
      req.user?.id,
      limitNum,
    );
    const summary = await this.analyticsService.getSalesSummary(
      req.user?.id,
      start,
      end,
    );

    // Transform to match export format
    const data = salesData.map((sale) => ({
      id: sale.id,
      created_at: sale.createdAt,
      item_count: sale.itemCount,
      total_amount: sale.totalAmount,
      profit: sale.profit,
      items: sale.items,
    }));

    const buffer = await this.exportService.exportToExcel(data, summary);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
    });

    return new StreamableFile(buffer);
  }

  @Get('export/pdf')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Export sales report to PDF' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'PDF report generated successfully',
  })
  async exportPDF(
    @Req() req: ReqWithAuth,
    @Res({ passthrough: true }) res: Response,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StreamableFile> {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const salesData = await this.analyticsService.getRecentSales(
      req.user?.id,
      limitNum,
    );
    const summary = await this.analyticsService.getSalesSummary(
      req.user?.id,
      start,
      end,
    );

    // Transform to match export format
    const data = salesData.map((sale) => ({
      id: sale.id,
      created_at: sale.createdAt,
      item_count: sale.itemCount,
      total_amount: sale.totalAmount,
      profit: sale.profit,
      items: sale.items,
    }));

    const buffer = await this.exportService.exportToPDF(
      data,
      summary,
      'WarungSense',
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`,
    });

    return new StreamableFile(buffer);
  }
}
