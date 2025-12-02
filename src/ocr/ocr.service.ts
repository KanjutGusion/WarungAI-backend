import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { NotaService } from 'src/nota/nota.service';
import { PrismaService } from 'src/_common/prisma/prisma.service';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private readonly kolosalApiKey: string | undefined;
  private readonly kolosalApiUrl = 'https://api.kolosal.ai/ocr/form';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly notaService: NotaService,
    private readonly prismaService: PrismaService,
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

      this.logger.debug(
        `Kolosal API Response: ${JSON.stringify(response.data, null, 2)}`,
      );

      const parsedNota = this.notaService.parse(response.data);
      const profit = parsedNota.total * 0.2; // Assume 20% profit margin

      const session = await this.prismaService.session.create({
        data: {
          rawText: parsedNota.rawText,
          parsed: parsedNota.items as any,
          items: {
            create: parsedNota.items.map((item) => ({
              name: item.name,
              qty: item.qty,
              unitPrice: item.price / item.qty,
              subtotal: item.price,
            })),
          },
          sale: {
            create: {
              totalAmount: parsedNota.total,
              profit: profit,
            },
          },
        },
        include: {
          items: true,
          sale: true,
        },
      });

      return {
        items: session.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.subtotal,
        })),
        total: session.sale!.totalAmount,
        profit: session.sale!.profit,
        summary: {},
      };
    } catch (error) {
      this.logger.error('Error processing OCR', error.stack);
      throw new InternalServerErrorException(
        'Failed to process OCR request.',
        error.response?.data,
      );
    }
  }
}
