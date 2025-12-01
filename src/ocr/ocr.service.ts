import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

@Injectable()
export class OcrService {
  private readonly kolosalApiKey: string | undefined;
  private readonly kolosalApiUrl = 'https://api.kolosal.ai/ocr/form';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.kolosalApiKey = this.configService.get<string>('KOLOSAL_API_KEY');
    if (!this.kolosalApiKey) {
      throw new UnauthorizedException('KOLOSAL_API_KEY is not configured.');
    }
  }

  async processOcr(file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new InternalServerErrorException('No file provided for OCR.');
    }

    const form = new FormData();
    form.append('image', file.buffer, file.originalname);

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.kolosalApiUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.kolosalApiKey}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling Kolosal OCR API:', error.response?.data);
      throw new InternalServerErrorException(
        'Failed to process OCR request.',
        error.response?.data,
      );
    }
  }
}
