import { Module } from '@nestjs/common';
import { CommonModule } from './_common/common.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
})
export class AppModule {}
