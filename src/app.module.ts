import { Module } from '@nestjs/common';
import { CommonModule } from './_common/common.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { OcrModule } from './ocr/ocr.module';

@Module({
  imports: [CommonModule, AuthModule, HealthModule, OcrModule],
})
export class AppModule {}
