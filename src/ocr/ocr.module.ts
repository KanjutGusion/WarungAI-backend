import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { HttpModule } from '@nestjs/axios';
import { CommonModule } from 'src/_common/common.module';

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
