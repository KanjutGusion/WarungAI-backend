import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { HttpModule } from '@nestjs/axios';
import { NotaModule } from 'src/nota/nota.module';

@Module({
  imports: [HttpModule, NotaModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
