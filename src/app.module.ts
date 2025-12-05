import { Module } from '@nestjs/common';
import { CommonModule } from './_common/common.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OcrModule } from './ocr/ocr.module';
import { NotaModule } from './nota/nota.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PricingModule } from './pricing/pricing.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    HealthModule,
    OcrModule,
    NotaModule,
    AnalyticsModule,
    PricingModule,
  ],
})
export class AppModule {}
