import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;
  private readonly model = 'qwen/qwen3-vl-30b-a3b-instruct';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('KOLOSAL_API_KEY');

    if (!apiKey) {
      throw new Error('KOLOSAL_API_KEY is not configured');
    }

    // Initialize OpenAI client with Kolosal's endpoint
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.kolosal.ai/v1',
    });

    this.logger.log('AI Service initialized with Kolosal API');
  }

  /**
   * Generate AI completion using Kolosal's LLM
   */
  async generateCompletion(
    prompt: string,
    maxTokens: number = 1000,
    temperature: number = 0.7,
  ): Promise<string> {
    try {
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
      this.logger.debug(`AI Response: ${content.substring(0, 100)}...`);

      return content;
    } catch (error) {
      this.logger.error('Error generating AI completion:', error);
      throw error;
    }
  }

  /**
   * Generate pricing recommendation using AI
   */
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

    try {
      const response = await this.generateCompletion(prompt, 500, 0.3);

      // Try to extract and parse JSON response
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '');
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '');

        // Try to find JSON object - look for the first { and last }
        const firstBrace = cleanedResponse.indexOf('{');
        const lastBrace = cleanedResponse.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = cleanedResponse
            .substring(firstBrace, lastBrace + 1)
            .trim();
          this.logger.debug(`Extracted JSON: ${jsonStr}`);

          const parsed = JSON.parse(jsonStr);

          // Validate the parsed object has required fields
          if (parsed.recommended_price && parsed.reasoning) {
            return {
              recommended_price: Math.round(Number(parsed.recommended_price)),
              reasoning: String(parsed.reasoning),
            };
          } else {
            this.logger.warn(
              `Missing required fields in parsed JSON: ${JSON.stringify(parsed)}`,
            );
          }
        } else {
          this.logger.warn('No valid JSON braces found in response');
        }
      } catch (parseError) {
        this.logger.warn(`JSON parsing failed: ${parseError.message}`);
        this.logger.debug(`Full response was: ${response}`);
      }

      // Fallback if JSON parsing fails
      this.logger.warn('Using fallback pricing calculation');
      return {
        recommended_price: Math.round(currentPrice * (1 + targetMargin / 100)),
        reasoning: `Fallback calculation: ${targetMargin}% markup on current price of Rp ${currentPrice.toLocaleString('id-ID')}`,
      };
    } catch (error) {
      this.logger.error('Error generating pricing recommendation:', error);
      throw error;
    }
  }

  /**
   * Analyze receipt text and provide insights
   */
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

    try {
      const response = await this.generateCompletion(prompt, 800, 0.7);

      try {
        const jsonMatch = response.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0].trim();
          const parsed = JSON.parse(jsonStr);

          if (parsed.insights) {
            return {
              insights: String(parsed.insights),
              suggestions: Array.isArray(parsed.suggestions)
                ? parsed.suggestions.map(String)
                : [],
            };
          }
        }
      } catch (parseError) {
        this.logger.warn(
          `JSON parsing failed for receipt analysis: ${parseError.message}`,
        );
      }

      // Fallback to using raw response
      return {
        insights: response.substring(0, 500),
        suggestions: [],
      };
    } catch (error) {
      this.logger.error('Error analyzing receipt:', error);
      throw error;
    }
  }

  /**
   * Generate market insights based on sales data
   */
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

    try {
      return await this.generateCompletion(prompt, 1000, 0.7);
    } catch (error) {
      this.logger.error('Error generating market insights:', error);
      throw error;
    }
  }
}
