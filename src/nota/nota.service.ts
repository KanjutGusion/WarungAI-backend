import { Injectable, Logger } from '@nestjs/common';
import { ParsedItemDto } from 'src/_common/dto/nota/parsed-item.dto';
import { ParsedNotaDto } from 'src/_common/dto/nota/parsed-nota.dto';

@Injectable()
export class NotaService {
  private readonly logger = new Logger(NotaService.name);

  parse(ocrResult: unknown): ParsedNotaDto {
    this.logger.log('Parsing OCR result...');
    const text = this.extractText(ocrResult);
    this.logger.debug(`Extracted Text:\n---\n${text}\n---`);
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    const items: ParsedItemDto[] = [];
    let total = 0;

    // Regex for Markdown table format, handles lines starting with | or -
    const itemRegex = /^[|-]\s*(.*?)\s*\|.*\|\s*([\d.,]+)/;

    for (const line of lines) {
      this.logger.debug(`Processing line: "${line}"`);

      const match = line.match(itemRegex);
      if (match) {
        const name = match[1].trim();

        // Skip header/total lines
        if (
          !name ||
          name.toLowerCase().includes('item') ||
          name.toLowerCase().includes('total')
        ) {
          continue;
        }

        const qty = 1; // Assume quantity is 1 for this format
        const price = parseFloat(match[2].replace(/[.,]/g, ''));

        if (isNaN(price)) continue;

        this.logger.debug(
          `Matched item: { name: "${name}", qty: ${qty}, price: ${price} }`,
        );
        items.push({ name, qty, price });
      } else if (line.toLowerCase().includes('total')) {
        const totalMatch = line.match(/([\d.,]+)/);
        if (totalMatch) {
          total = Math.max(
            total,
            parseFloat(totalMatch[0].replace(/[.,]/g, '')),
          );
        }
      }
    }

    if (total === 0 && items.length > 0) {
      total = items.reduce((acc, item) => acc + item.price, 0);
    }

    this.logger.log(`Parsed ${items.length} items, total: ${total}`);

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

    this.logger.warn('Could not extract text from OCR result.');
    return '';
  }
}
