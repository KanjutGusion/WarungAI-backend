import { Module } from '@nestjs/common';
import { CommonModule } from './_common/common.module';

@Module({
  imports: [CommonModule],
})
export class AppModule {}
