import { Injectable, Logger } from '@nestjs/common';

interface ParsedItem {
  name: string;
  qty: number;
  price: number;
}

export interface ParsedNota {
  items: ParsedItem[];
  total: number;
  rawText: string;
}

@Injectable()
export class NotaService {
  private readonly logger = new Logger(NotaService.name);

  parse(ocrResult: any): ParsedNota {
    this.logger.log('Parsing OCR result...');
    const text = this.extractText(ocrResult);
    this.logger.debug(`Extracted Text:\n---\n${text}\n---`);
    const lines = text.split('\n').filter((line) => line.trim() !== '');

    const items: ParsedItem[] = [];
    let total = 0;

    // Regex for Markdown table format, handles lines starting with | or -
    const itemRegex = /^[|\-]\s*(.*?)\s*\|.*\|\s*([\d.,]+)/;

    for (const line of lines) {
      this.logger.debug(`Processing line: "${line}"`);

      const match = line.match(itemRegex);
      if (match) {
        const name = match[1].trim();

        // Skip header/total lines
        if (!name || name.toLowerCase().includes('item') || name.toLowerCase().includes('total')) {
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

  private extractText(ocrResult: any): string {
    if (typeof ocrResult === 'string') {
      return ocrResult;
    }

    if (
      ocrResult &&
      ocrResult.extracted_text &&
      typeof ocrResult.extracted_text === 'string'
    ) {
      return ocrResult.extracted_text;
    }

    if (
      ocrResult &&
      ocrResult.data &&
      typeof ocrResult.data.text === 'string'
    ) {
      return ocrResult.data.text;
    }

    if (ocrResult && ocrResult.text && typeof ocrResult.text === 'string') {
      return ocrResult.text;
    }

    if (ocrResult && Array.isArray(ocrResult)) {
      return ocrResult.map((r) => r.text).join('\n');
    }

    this.logger.warn('Could not extract text from OCR result.');
    return '';
  }
}
