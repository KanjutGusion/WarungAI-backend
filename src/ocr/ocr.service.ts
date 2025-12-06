import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { PrismaService } from 'src/_common/prisma/prisma.service';
import { OcrProcessResponseDto } from 'src/_common/dto/ocr/ocr-process-response.dto';
import { Prisma } from 'src/generated/prisma/client';
import axios, { AxiosResponse } from 'axios';
import { AiService } from 'src/_common/ai/ai.service';
import { ParsedNotaDto } from 'src/_common/dto/ocr/parsed-nota.dto';
import { ParsedItemDto } from 'src/_common/dto/ocr/parsed-item.dto';

@Injectable()
export class OcrService {
  private readonly kolosalApiKey: string | undefined;
  private readonly kolosalApiUrl = 'https://api.kolosal.ai/ocr/form';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly aiService: AiService,
  ) {
    this.kolosalApiKey = this.configService.get<string>('KOLOSAL_API_KEY');
    if (!this.kolosalApiKey) {
      throw new UnauthorizedException('KOLOSAL_API_KEY is not configured.');
    }
  }

  async processOcr(
    file: Express.Multer.File,
    userId?: string,
  ): Promise<OcrProcessResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided for OCR.');
    }

    const form = new FormData();
    form.append('image', file.buffer, file.originalname);
    form.append('invoice', 'false');
    form.append('language', 'auto');

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(this.kolosalApiUrl, form, {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.kolosalApiKey}`,
          },
        }),
      );

      const rawText = this.extractText(response.data as unknown);
      let parsedNota: ParsedNotaDto;

      try {
        parsedNota = await this.aiService.normalizeOcrData(rawText);
        if (!parsedNota.items || parsedNota.items.length === 0) {
          parsedNota = this.parseWithRegex(rawText);
        }
      } catch {
        parsedNota = this.parseWithRegex(rawText);
      }

      if (!parsedNota.items || parsedNota.items.length === 0) {
        throw new BadRequestException('No items found in the receipt.');
      }

      if (isNaN(parsedNota.total) || parsedNota.total <= 0) {
        throw new BadRequestException('Invalid total amount in the receipt.');
      }

      const profit = parsedNota.total * 0.2;
      const profitMargin =
        parsedNota.total > 0 ? (profit / parsedNota.total) * 100 : 0;

      const session = await this.prismaService.session.create({
        data: {
          userId: userId || null,
          rawText: parsedNota.rawText,
          parsed: JSON.parse(
            JSON.stringify(parsedNota.items),
          ) as Prisma.JsonArray,
          items: {
            create: parsedNota.items.map((item) => {
              const unitPrice =
                item.qty > 0 ? item.price / item.qty : item.price;
              return {
                name: item.name,
                qty: item.qty,
                unitPrice: unitPrice,
                subtotal: item.price,
              };
            }),
          },
          sale: {
            create: {
              totalAmount: parsedNota.total,
              profit: profit,
              profitMargin: profitMargin,
            },
          },
        },
        include: {
          items: true,
          sale: true,
        },
      });

      const { insights, suggestions } = await this.aiService.analyzeReceipt(
        rawText,
        session.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.subtotal.toNumber(),
        })),
      );

      return {
        items: session.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.subtotal.toNumber(),
        })),
        total: session.sale!.totalAmount.toNumber(),
        profit: session.sale!.profit.toNumber(),
        summary: {
          insights,
          suggestions,
        },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new InternalServerErrorException(
          'Failed to process OCR request.',
          error.message,
        );
      }
      throw new InternalServerErrorException('Failed to process OCR request.');
    }
  }

  private parseWithRegex(ocrResult: unknown): ParsedNotaDto {
    const text = this.extractText(ocrResult);
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    const items: ParsedItemDto[] = [];
    let total = 0;

    const itemRegex =
      /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*([^|]+?)\s*\|\s*([\d.,]+)\s*\/[^|]+\|\s*Rp([\d.,]+)/;

    for (const line of lines) {
      const match = line.match(itemRegex);
      if (match) {
        const name = match[2].trim();
        const qty = parseInt(match[3].trim(), 10);
        const totalPrice = parseFloat(match[6].replace(/[.,]/g, ''));

        if (!name || name.toLowerCase().includes('nama') || name === '---') {
          continue;
        }

        if (isNaN(qty) || isNaN(totalPrice)) continue;

        items.push({ name, qty, price: totalPrice });
      } else if (
        line.toLowerCase().includes('jumlah') ||
        line.toLowerCase().includes('total')
      ) {
        const totalMatch = line.match(/Rp([\d.,]+)/);
        if (totalMatch) {
          const extractedTotal = parseFloat(totalMatch[1].replace(/[.,]/g, ''));
          if (!isNaN(extractedTotal)) {
            total = Math.max(total, extractedTotal);
          }
        }
      }
    }

    if (total === 0 && items.length > 0) {
      total = items.reduce((acc, item) => acc + item.price, 0);
    }

    return {
      items,
      total,
      rawText: text,
    };
  }

  private extractText(ocrResult: unknown): string {
    if (typeof ocrResult === 'string') {
      return ocrResult;
    }

    if (
      ocrResult &&
      typeof ocrResult === 'object' &&
      'extracted_text' in ocrResult &&
      typeof (ocrResult as { extracted_text: unknown }).extracted_text ===
        'string'
    ) {
      return (ocrResult as { extracted_text: string }).extracted_text;
    }

    if (
      ocrResult &&
      typeof ocrResult === 'object' &&
      'data' in ocrResult &&
      (ocrResult as { data: unknown }).data &&
      typeof (ocrResult as { data: unknown }).data === 'object' &&
      'text' in (ocrResult as { data: object }).data &&
      typeof (
        (ocrResult as { data: { text: unknown } }).data as { text: unknown }
      ).text === 'string'
    ) {
      return (
        (ocrResult as { data: { text: string } }).data as { text: string }
      ).text;
    }

    if (
      ocrResult &&
      typeof ocrResult === 'object' &&
      'text' in ocrResult &&
      typeof (ocrResult as { text: unknown }).text === 'string'
    ) {
      return (ocrResult as { text: string }).text;
    }

    if (Array.isArray(ocrResult)) {
      return ocrResult
        .map((r: unknown) => {
          if (
            r &&
            typeof r === 'object' &&
            'text' in r &&
            typeof (r as { text: unknown }).text === 'string'
          ) {
            return (r as { text: string }).text;
          }
          return '';
        })
        .join('\n');
    }

    return '';
  }
}
