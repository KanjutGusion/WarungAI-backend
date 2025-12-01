import { Module } from '@nestjs/common';
import { CommonModule } from './_common/common.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [CommonModule, AuthModule, HealthModule],
})
export class AppModule {}
