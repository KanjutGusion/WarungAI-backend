import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
