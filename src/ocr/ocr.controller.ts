import {
  Controller,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { EUserRole } from 'src/types';
import { OcrProcessResponseDto } from 'src/_common/dto/ocr/ocr-process-response.dto';
import { OcrRequestDto } from 'src/_common/dto/ocr/ocr-request.dto';

@ApiTags('OCR')
@ApiBearerAuth()
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @HttpCode(200)
  @Roles([EUserRole.SELLER, EUserRole.SUPER_ADMIN])
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Parse a receipt image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: OcrRequestDto })
  @ApiResponse({
    status: 200,
    description: 'OCR process successful',
    type: OcrProcessResponseDto,
  })
  async parseOcr(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<OcrProcessResponseDto> {
    return this.ocrService.processOcr(file);
  }
}
