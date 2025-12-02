import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { EUserRole } from 'src/types';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @HttpCode(200)
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async parseOcr(@UploadedFile() file: Express.Multer.File) {
    return this.ocrService.processOcr(file);
  }
}
