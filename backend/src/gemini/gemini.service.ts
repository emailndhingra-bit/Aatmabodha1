import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { QuestionsService } from '../questions/questions.service';

/** Chat generateContent: Render cold starts + Gemini can exceed 30s easily */
const CHAT_GENERATE_TIMEOUT_MS = 180_000;

function isAbortError(err: unknown): boolean {
  if (err instanceof Error && err.name === 'AbortError') return true;
  if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') return true;
  return false;
}

@Injectable()
export class GeminiService {
  private readonly apiKey = process.env.GEMINI_API_KEY || '';
  private readonly model = 'gemini-3.1-pro-preview';

  private readonly inflightRequests = new Map<string, Promise<any>>();
  private readonly contextCache = new Map<string, { name: string; expiresAt: number }>();

  constructor(private questionsService: QuestionsService) {}

  /**
   * Context-cache key must stay stable across requests (no dates / transit blobs in the key).
   * If systemInstruction ever embeds dynamic blocks, hash only the prefix before those markers,
   * strip ISO dates (YYYY-MM-DD), then first 200 chars — plus userId / natalFingerprint so entries
   * do not collide across users or charts.
   */
  private contextInstructionCacheKey(
    systemInstruction: string,
    userId?: string,
    natalFingerprint?: string,
  ): string {
    const dynamicMarkers = ['Today:', 'TRANSITS:', 'Current Date:', 'CURRENT_DATE:'];
    let cut = -1;
    for (const marker of dynamicMarkers) {
      const idx = systemInstruction.indexOf(marker);
      if (idx !== -1 && (cut === -1 || idx < cut)) cut = idx;
    }
    let stableContent =
      cut > 0 ? systemInstruction.substring(0, cut) : systemInstruction;
    stableContent = stableContent.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '__DATE__');
    const prefix = `${userId ?? 'anon'}\x1e${(natalFingerprint ?? '').trim()}\x1e`;
    return createHash('sha256')
      .update(prefix + stableContent.substring(0, 200))
      .digest('hex');
  }

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
    const { systemInstruction, history = [], message, userQuestion, natalFingerprint, pastContext } =
      body;
    const past =
      typeof pastContext === 'string' && pastContext.trim().length > 0
        ? pastContext.trim()
        : '';
    const baseSi = systemInstruction;
    const effectiveSi =
      baseSi && past
        ? `${baseSi}\n\n# USER'S RECENT QUESTIONS (last 5):\n${past}\n\nUse this for continuity. Reference naturally.`
        : baseSi;

    const contents = [
      ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    let cachedContentName: string | null = null;
    /** True only when reusing an existing Gemini cachedContent handle (not first create). */
    let contextCacheHit = false;

    // Per-turn pastContext would bust Gemini cachedContents; use inline systemInstruction only.
    if (baseSi && !past) {
      const natalFp =
        typeof natalFingerprint === 'string' ? natalFingerprint : undefined;
      const instructionKey = this.contextInstructionCacheKey(
        baseSi,
        userId,
        natalFp,
      );
      const entry = this.contextCache.get(instructionKey);
      if (entry && Date.now() < entry.expiresAt) {
        cachedContentName = entry.name;
        contextCacheHit = true;
        console.log('[ContextCache] Hit:', cachedContentName);
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                model: 'models/gemini-3.1-pro-preview',
                systemInstruction: { parts: [{ text: baseSi }] },
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
          this.contextCache.set(instructionKey, { name, expiresAt: Date.now() + 3500000 });
          cachedContentName = name;
          console.log('[ContextCache] Created:', name);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn('[ContextCache] Failed:', msg);
          cachedContentName = null;
        } finally {
          clearTimeout(timeout);
        }
      }
    }

    const payload: Record<string, unknown> = { contents };
    if (cachedContentName) {
      payload.cachedContent = cachedContentName;
    } else if (effectiveSi) {
      payload.systemInstruction = { parts: [{ text: effectiveSi }] };
    }

    const genController = new AbortController();
    const genTimeout = setTimeout(() => genController.abort(), CHAT_GENERATE_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: genController.signal,
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
            question: userQuestion || message,
            response: text,
            language: body.language || 'EN',
            cacheHit: contextCacheHit,
          })
          .catch(() => {});
      }

      return { text, cacheHit: contextCacheHit, costUsd, inputTokens, outputTokens };
    } catch (err: unknown) {
      if (isAbortError(err)) {
        console.warn('[Gemini chat] generateContent aborted (timeout or client disconnect)');
        return {
          text: '',
          cacheHit: false,
          costUsd: 0,
          inputTokens: 0,
          outputTokens: 0,
          error: 'The model request timed out. Please try again.',
        };
      }
      throw err;
    } finally {
      clearTimeout(genTimeout);
    }
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
