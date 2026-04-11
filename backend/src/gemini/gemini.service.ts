import { Injectable } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = 'gemini-3.1-pro-preview';

  private readonly inflightRequests = new Map<string, Promise<any>>();
  private readonly contextCache = new Map<string, { name: string; expiresAt: number }>();

  constructor(private questionsService: QuestionsService) {}

  async generateContent(body: any, userId?: string): Promise<any> {
    const { prompt, responseFormat, imageParts = [] } = body;
    const inflightKey = `${(prompt || '').substring(0, 100)}${responseFormat ?? ''}`;

    const run = async (): Promise<any> => {
      const parts: any[] = imageParts.map((img: any) => ({
        inlineData: { mimeType: img.mimeType, data: img.data },
      }));
      parts.push({ text: prompt });

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: responseFormat === 'json' ? { responseMimeType: 'application/json' } : {},
          }),
        },
      );
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const inputTokens = this.questionsService.estimateTokens(prompt);
      const outputTokens = this.questionsService.estimateTokens(text);
      const costUsd = this.questionsService.estimateCost(inputTokens, outputTokens);

      if (userId) {
        await this.questionsService
          .logQuestion({
            userId,
            question: prompt,
            response: text,
            language: body.language,
            cacheHit: false,
          })
          .catch(() => {});
      }

      return { text, cacheHit: false, costUsd, inputTokens, outputTokens };
    };

    if (imageParts.length > 0) {
      return run();
    }

    let p = this.inflightRequests.get(inflightKey);
    if (!p) {
      p = run().finally(() => this.inflightRequests.delete(inflightKey));
      this.inflightRequests.set(inflightKey, p);
    }
    return p;
  }

  async chat(body: any, userId?: string): Promise<any> {
    const { systemInstruction, history = [], message } = body;
    const contents = [
      ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    let cachedContentName: string | null = null;

    if (userId && systemInstruction) {
      const entry = this.contextCache.get(userId);
      if (entry && Date.now() < entry.expiresAt) {
        cachedContentName = entry.name;
        console.log('[ContextCache] Hit:', cachedContentName);
      } else {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'models/gemini-3.1-pro-preview',
                systemInstruction: { parts: [{ text: systemInstruction }] },
                ttl: '3600s',
                contents: [],
              }),
            },
          );
          const created = await res.json();
          if (!res.ok) {
            throw new Error(created?.error?.message || `HTTP ${res.status}`);
          }
          const name = created.name as string;
          this.contextCache.set(userId, { name, expiresAt: Date.now() + 3500000 });
          cachedContentName = name;
          console.log('[ContextCache] Created:', name);
        } catch {
          console.warn('[ContextCache] Failed, using direct call');
          cachedContentName = null;
        }
      }
    }

    const payload: Record<string, unknown> = { contents };
    if (cachedContentName) {
      payload.cachedContent = cachedContentName;
    } else if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const inputTokens = this.questionsService.estimateTokens(message);
    const outputTokens = this.questionsService.estimateTokens(text);
    const costUsd = this.questionsService.estimateCost(inputTokens, outputTokens);

    if (userId) {
      await this.questionsService
        .logQuestion({
          userId,
          question: message,
          response: text,
          language: body.language,
          cacheHit: false,
        })
        .catch(() => {});
    }

    return { text, cacheHit: false, costUsd, inputTokens, outputTokens };
  }

  async generateImage(body: any): Promise<any> {
    const { prompt, imageParts = [] } = body;
    const parts: any[] = imageParts.map((img: any) => ({
      inlineData: { mimeType: img.mimeType, data: img.data },
    }));
    parts.push({ text: prompt });

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      },
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
    return {
      size: this.contextCache.size,
      maxSize: 0,
      ttlHours: 1,
      note: 'Gemini Native Context Caching - $0.20/1M vs $2.00/1M',
    };
  }
}
