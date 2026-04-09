import { Injectable } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';

interface CacheEntry {
  text: string;
  timestamp: number;
}

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = 'gemini-3.1-pro-preview';
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 1000 * 60 * 60 * 6;

  constructor(private questionsService: QuestionsService) {}

  private getCacheKey(prompt: string): string {
    return prompt.substring(0, 200).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.text;
  }

  private setCache(key: string, text: string): void {
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { text, timestamp: Date.now() });
  }

  async generateContent(body: any, userId?: string): Promise<any> {
    const { prompt, responseFormat, imageParts = [] } = body;
    const cacheKey = this.getCacheKey(prompt);
    const cached = imageParts.length === 0 ? this.getFromCache(cacheKey) : null;

    if (cached) {
      if (userId) {
        await this.questionsService.logQuestion({
          userId, question: prompt, response: cached,
          language: body.language, cacheHit: true,
        }).catch(() => {});
      }
      return { text: cached, cacheHit: true, costUsd: 0 };
    }

    const parts: any[] = imageParts.map((img: any) => ({
      inlineData: { mimeType: img.mimeType, data: img.data }
    }));
    parts.push({ text: prompt });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (imageParts.length === 0) this.setCache(cacheKey, text);

    const inputTokens  = this.questionsService.estimateTokens(prompt);
    const outputTokens = this.questionsService.estimateTokens(text);
    const costUsd = this.questionsService.estimateCost(inputTokens, outputTokens);

    if (userId) {
      await this.questionsService.logQuestion({
        userId, question: prompt, response: text,
        language: body.language, cacheHit: false,
      }).catch(() => {});
    }

    return { text, cacheHit: false, costUsd, inputTokens, outputTokens };
  }

  async chat(body: any, userId?: string): Promise<any> {
    const { systemInstruction, history = [], message } = body;
    const cacheKey = this.getCacheKey(message);
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      if (userId) {
        await this.questionsService.logQuestion({
          userId, question: message, response: cached,
          language: body.language, cacheHit: true,
        }).catch(() => {});
      }
      return { text: cached, cacheHit: true, costUsd: 0 };
    }

    const contents = [
      ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          contents
        })
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    this.setCache(cacheKey, text);

    const inputTokens  = this.questionsService.estimateTokens(message);
    const outputTokens = this.questionsService.estimateTokens(text);
    const costUsd = this.questionsService.estimateCost(inputTokens, outputTokens);

    if (userId) {
      await this.questionsService.logQuestion({
        userId, question: message, response: text,
        language: body.language, cacheHit: false,
      }).catch(() => {});
    }

    return { text, cacheHit: false, costUsd, inputTokens, outputTokens };
  }

  async generateImage(body: any): Promise<any> {
    const { prompt, imageParts = [] } = body;
    const parts: any[] = imageParts.map((img: any) => ({
      inlineData: { mimeType: img.mimeType, data: img.data }
    }));
    parts.push({ text: prompt });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      }
    );
    const data = await res.json();
    for (const part of data?.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }
    return { error: 'No image returned' };
  }

  getCacheStats() {
    return { size: this.cache.size, maxSize: 1000, ttlHours: 6 };
  }
}
