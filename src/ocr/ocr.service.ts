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
import { OcrProcessResponseDto } from 'src/_common/dto/ocr/ocr-process-response.dto';
import { Prisma } from 'src/generated/prisma/client';
import axios, { AxiosResponse } from 'axios';

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

  async processOcr(file: Express.Multer.File): Promise<OcrProcessResponseDto> {
    if (!file) {
      throw new InternalServerErrorException('No file provided for OCR.');
    }

    const form = new FormData();
    form.append('image', file.buffer, file.originalname);

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(this.kolosalApiUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.kolosalApiKey}`,
          },
        }),
      );

      const parsedNota = this.notaService.parse(response.data);
      const profit = parsedNota.total * 0.2; // Assume 20% profit margin

      const session: Prisma.SessionGetPayload<{
        include: { items: true; sale: true };
      }> = await this.prismaService.session.create({
        data: {
          rawText: parsedNota.rawText,
          parsed: JSON.parse(
            JSON.stringify(parsedNota.items),
          ) as Prisma.JsonArray,
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
          price: item.subtotal.toNumber(),
        })),
        total: session.sale!.totalAmount.toNumber(),
        profit: session.sale!.profit.toNumber(),
        summary: {},
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const description = error.response?.data
          ? JSON.stringify(error.response.data)
          : 'No additional error data provided.';
        throw new InternalServerErrorException(
          'Failed to process OCR request.',
          description,
        );
      }
      throw new InternalServerErrorException('Failed to process OCR request.');
    }
  }
}
