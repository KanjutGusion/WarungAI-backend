import { Controller, Get, Query, Req, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { EUserRole } from 'src/types';
import type { ReqWithAuth } from 'src/types';
import { PricingRecommendationDto } from 'src/_common/dto/pricing/pricing-recommendation.dto';

@ApiTags('Pricing')
@ApiBearerAuth()
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('recommendations')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get AI-powered pricing recommendations' })
  @ApiQuery({
    name: 'target_margin',
    required: false,
    type: Number,
    description: 'Target profit margin percentage (default: 25)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing recommendations retrieved successfully',
    type: [PricingRecommendationDto],
  })
  async getPricingRecommendations(
    @Req() req: ReqWithAuth,
    @Query('target_margin') targetMargin?: string,
  ): Promise<PricingRecommendationDto[]> {
    const margin = targetMargin ? parseFloat(targetMargin) : 25;
    return this.pricingService.getPricingRecommendations(req.user?.id, margin);
  }

  @Get('recommendations/:item_name')
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @ApiOperation({ summary: 'Get pricing recommendation for a specific item' })
  @ApiParam({
    name: 'item_name',
    description: 'Name of the item',
    example: 'Indomie Goreng',
  })
  @ApiQuery({
    name: 'target_margin',
    required: false,
    type: Number,
    description: 'Target profit margin percentage (default: 25)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing recommendation retrieved successfully',
    type: PricingRecommendationDto,
  })
  async getItemPricingRecommendation(
    @Req() req: ReqWithAuth,
    @Param('item_name') itemName: string,
    @Query('target_margin') targetMargin?: string,
  ): Promise<PricingRecommendationDto | null> {
    const margin = targetMargin ? parseFloat(targetMargin) : 25;
    const recommendation: PricingRecommendationDto | null =
      await this.pricingService.getItemPricingRecommendation(
        itemName,
        req.user?.id,
        margin,
      );
    return recommendation;
  }
}
