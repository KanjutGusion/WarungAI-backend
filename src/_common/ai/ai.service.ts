import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ParsedItemDto } from 'src/_common/dto/ocr/parsed-item.dto';
import { ParsedNotaDto } from 'src/_common/dto/ocr/parsed-nota.dto';

@Injectable()
export class AiService {
  private readonly client: OpenAI;
  private readonly model = 'qwen/qwen3-vl-30b-a3b-instruct';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('KOLOSAL_API_KEY');
    const baseURL = this.configService.get<string>('KOLOSAL_BASE_URL');

    if (!apiKey) {
      throw new Error('KOLOSAL_API_KEY is not configured');
    }

    if (!baseURL) {
      throw new Error('KOLOSAL_BASE_URL is not configured');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async generateCompletion(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.7,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    const content = response.choices[0]?.message?.content || '';

    return content;
  }

  async normalizeOcrData(rawText: string): Promise<ParsedNotaDto> {
    const prompt = `
      You are an expert receipt parser. Extract item details from the following raw text from an OCR scan of a receipt.
      The text is from an Indonesian receipt.

      Raw Text:
      """
      ${rawText}
      """

      You MUST respond with ONLY a valid JSON object in the following format. Do not include any other text, explanations, or markdown.
      The JSON object should contain 'items' (an array of objects with 'name', 'qty', and 'price') and 'total' (a number).
      - "name" should be a string.
      - "qty" should be a number.
      - "price" should be the total price for that line item as a number, not the unit price.
      - "total" should be the grand total of the receipt. If not found, calculate it from the sum of item prices.

      Example response:
      {
        "items": [
          { "name": "PRO MIE INSTAN", "qty": 3, "price": 7500 },
          { "name": "BIMOLI MINYAK", "qty": 1, "price": 25000 }
        ],
        "total": 32500
      }
    `;

    const result = await this.generateCompletion(prompt, 1000, 0.2);
    let cleanedResponse = result.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[0].trim();
      const parsed = JSON.parse(jsonStr) as {
        items: ParsedItemDto[];
        total: number;
      };

      if (parsed.items && parsed.total) {
        return {
          ...parsed,
          rawText,
        };
      }
    }

    return {
      items: [],
      total: 0,
      rawText,
    };
  }

  async generatePricingRecommendation(
    itemName: string,
    currentPrice: number,
    salesData: {
      total_qty: number;
      total_revenue: number;
      frequency: number;
    },
    targetMargin: number,
  ): Promise<{
    recommended_price: number;
    reasoning: string;
  }> {
    const prompt = `You are a pricing expert for Indonesian MSMEs (small businesses/warungs).

Item: ${itemName}
Current Average Price: Rp ${currentPrice.toLocaleString('id-ID')}
Sales Data:
- Total Quantity Sold: ${salesData.total_qty} units
- Total Revenue: Rp ${salesData.total_revenue.toLocaleString('id-ID')}
- Number of Transactions: ${salesData.frequency}
Target Profit Margin: ${targetMargin}%

IMPORTANT: You MUST respond with ONLY a valid JSON object, nothing else. No explanations before or after.

Provide a recommended selling price and reasoning in this EXACT JSON format:
{
  "recommended_price": 15000,
  "reasoning": "Your reasoning here"
}

Do not include any text before or after the JSON object.`;

    const response = await this.generateCompletion(prompt, 500, 0.3);

    let cleanedResponse = response.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');

    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleanedResponse
        .substring(firstBrace, lastBrace + 1)
        .trim();

      const parsed = JSON.parse(jsonStr) as unknown;

      if (
        parsed &&
        typeof parsed === 'object' &&
        'recommended_price' in parsed &&
        'reasoning' in parsed
      ) {
        const typedParsed = parsed as {
          recommended_price: number;
          reasoning: string;
        };

        return {
          recommended_price: Math.round(Number(typedParsed.recommended_price)),
          reasoning: String(typedParsed.reasoning),
        };
      }
    }

    return {
      recommended_price: Math.round(currentPrice * (1 + targetMargin / 100)),
      reasoning: `Fallback calculation: ${targetMargin}% markup on current price of Rp ${currentPrice.toLocaleString('id-ID')}`,
    };
  }

  async analyzeReceipt(
    rawText: string,
    items: Array<{ name: string; qty: number; price: number }>,
  ): Promise<{
    insights: string;
    suggestions: string[];
  }> {
    const prompt = `You are an AI assistant for Indonesian warung (small shop) owners.

Analyze this receipt:
Raw Text: ${rawText}

Parsed Items:
${items.map((item) => `- ${item.name}: ${item.qty}x @ Rp ${item.price.toLocaleString('id-ID')}`).join('\n')}

IMPORTANT: You MUST respond with ONLY a valid JSON object, nothing else.

Provide business insights and suggestions in this EXACT JSON format:
{
  "insights": "Your insights here",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Do not include any text before or after the JSON object.`;

    const response = await this.generateCompletion(prompt, 800, 0.7);

    return {
      insights: response.substring(0, 500),
      suggestions: [],
    };
  }
  async generateMarketInsights(
    topItems: Array<{
      name: string;
      total_qty: number;
      total_revenue: number;
      frequency: number;
    }>,
    salesSummary: {
      total_sales: number;
      total_profit: number;
      avg_profit_margin: number;
      transaction_count: number;
    },
  ): Promise<string> {
    const prompt = `You are a business analyst for Indonesian MSMEs.

Sales Summary:
- Total Sales: Rp ${salesSummary.total_sales.toLocaleString('id-ID')}
- Total Profit: Rp ${salesSummary.total_profit.toLocaleString('id-ID')}
- Average Profit Margin: ${salesSummary.avg_profit_margin}%
- Total Transactions: ${salesSummary.transaction_count}

Top Selling Items:
${topItems
  .slice(0, 5)
  .map(
    (item, i) =>
      `${i + 1}. ${item.name} - ${item.total_qty} units, Rp ${item.total_revenue.toLocaleString('id-ID')} revenue, ${item.frequency} transactions`,
  )
  .join('\n')}

Provide comprehensive market insights and strategic recommendations for this warung owner in Indonesian context. Focus on:
1. Sales performance analysis
2. Product mix optimization
3. Pricing strategy
4. Growth opportunities

Keep it concise and actionable (max 300 words).`;

    return await this.generateCompletion(prompt, 1000, 0.7);
  }
}
