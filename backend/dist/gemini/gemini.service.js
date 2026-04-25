"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const questions_service_1 = require("../questions/questions.service");
const GEMINI_GENERATE_TIMEOUT_MS = 170000;
function isAbortError(err) {
    if (err instanceof Error && err.name === 'AbortError')
        return true;
    if (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError')
        return true;
    return false;
}
let GeminiService = class GeminiService {
    constructor(questionsService) {
        this.questionsService = questionsService;
        this.apiKey = process.env.GEMINI_API_KEY || '';
        this.model = 'gemini-3.1-pro-preview';
        this.inflightRequests = new Map();
        this.contextCache = new Map();
    }
    contextInstructionCacheKey(systemInstruction, userId, natalFingerprint) {
        const dynamicMarkers = ['Today:', 'TRANSITS:', 'Current Date:', 'CURRENT_DATE:'];
        let cut = -1;
        for (const marker of dynamicMarkers) {
            const idx = systemInstruction.indexOf(marker);
            if (idx !== -1 && (cut === -1 || idx < cut))
                cut = idx;
        }
        let stableContent = cut > 0 ? systemInstruction.substring(0, cut) : systemInstruction;
        stableContent = stableContent.replace(/\b\d{4}-\d{2}-\d{2}\b/g, '__DATE__');
        const prefix = `${userId ?? 'anon'}\x1e${(natalFingerprint ?? '').trim()}\x1e`;
        return (0, crypto_1.createHash)('sha256')
            .update(prefix + stableContent.substring(0, 200))
            .digest('hex');
    }
    costFromUsageMetadata(data) {
        const usage = data?.usageMetadata;
        if (!usage || typeof usage.promptTokenCount !== 'number')
            return null;
        const inputTokens = usage.promptTokenCount;
        const outputTokens = typeof usage.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : 0;
        const cachedTokens = typeof usage.cachedContentTokenCount === 'number'
            ? usage.cachedContentTokenCount
            : 0;
        const cachedInputCost = (cachedTokens * 0.135) / 1e6;
        const uncachedInputCost = (Math.max(0, inputTokens - cachedTokens) * 1.25) / 1e6;
        const outputCost = (outputTokens * 10.0) / 1e6;
        const costUsd = Math.round((cachedInputCost + uncachedInputCost + outputCost) * 1e6) / 1e6;
        return { inputTokens, outputTokens, cachedTokens, costUsd };
    }
    truncatePreservingSugg(text, keywordSource) {
        const suggMatch = text.match(/<<<SUGG[\s\S]*?>>>/);
        const suggBlock = suggMatch ? suggMatch[0] : '';
        const textBody = suggBlock ? text.replace(suggBlock, '').trim() : text;
        const lc = keywordSource.toLowerCase();
        const charLimit = lc.includes('table') ||
            lc.includes('each year') ||
            lc.includes('year by year') ||
            lc.includes('list all')
            ? 1800
            : 2800;
        let truncated = textBody;
        if (textBody.length > charLimit) {
            const cutPoint = textBody.lastIndexOf('.', charLimit);
            truncated =
                cutPoint > 0 ? textBody.substring(0, cutPoint + 1) : textBody.substring(0, charLimit);
        }
        return suggBlock ? `${truncated}\n\n${suggBlock}` : truncated;
    }
    capChatOutputAtMaxChars(text, maxChars) {
        if (!text || text.length <= maxChars)
            return text;
        const suggMatch = text.match(/<<<SUGG[\s\S]*?>>>/);
        const suggBlock = suggMatch ? suggMatch[0] : '';
        const body = suggBlock ? text.replace(suggBlock, '').trim() : text;
        const cut = body.lastIndexOf('.', maxChars);
        const truncatedBody = cut > 0 ? body.slice(0, cut + 1) : body.slice(0, maxChars);
        return suggBlock ? `${truncatedBody}\n\n${suggBlock}` : truncatedBody;
    }
    async generateContent(body, userId) {
        const { prompt, responseFormat, imageParts = [] } = body;
        const inflightKey = `${(prompt || '').substring(0, 100)}${responseFormat ?? ''}`;
        const run = async () => {
            const parts = imageParts.map((img) => ({
                inlineData: { mimeType: img.mimeType, data: img.data },
            }));
            parts.push({ text: prompt });
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_GENERATE_TIMEOUT_MS);
            const genCfg = {};
            if (responseFormat === 'json')
                genCfg.responseMimeType = 'application/json';
            if (typeof body.maxOutputTokens === 'number' && body.maxOutputTokens > 0) {
                genCfg.maxOutputTokens = body.maxOutputTokens;
            }
            const reqBody = { contents: [{ parts }] };
            if (Object.keys(genCfg).length > 0)
                reqBody.generationConfig = genCfg;
            let res;
            try {
                res = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody),
                    signal: controller.signal,
                });
            }
            catch (err) {
                if (isAbortError(err)) {
                    return {
                        text: '',
                        error: 'The model request timed out. Please try again.',
                        cacheHit: false,
                        costUsd: 0,
                        inputTokens: 0,
                        outputTokens: 0,
                    };
                }
                throw err;
            }
            finally {
                clearTimeout(timeoutId);
            }
            const data = await res.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            text = this.truncatePreservingSugg(text, String(prompt || ''));
            const fromUsage = this.costFromUsageMetadata(data);
            let inputTokens;
            let outputTokens;
            let costUsd;
            if (fromUsage) {
                inputTokens = fromUsage.inputTokens;
                outputTokens = fromUsage.outputTokens;
                costUsd = fromUsage.costUsd;
            }
            else {
                inputTokens = 0;
                outputTokens = 0;
                costUsd = 0;
            }
            if (userId && !body.skipQuestionLog) {
                await this.questionsService
                    .logQuestion({
                    userId,
                    question: prompt,
                    response: text,
                    language: body.language,
                    cacheHit: false,
                    costUsd,
                })
                    .catch(() => { });
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
    async chat(body, userId) {
        const { systemInstruction, history = [], message, userQuestion, natalFingerprint, pastContext } = body;
        const past = typeof pastContext === 'string' && pastContext.trim().length > 0
            ? pastContext.trim()
            : '';
        const baseSi = systemInstruction;
        const effectiveSi = baseSi;
        const userTurnText = past
            ? `${message}\n\n[PAST CONTEXT - user's recent questions for continuity:\n${past}\nReference naturally, never say "as per last conversation".]`
            : message;
        const cappedHistory = history.slice(-4).map((h) => ({
            role: h.role,
            parts: [{ text: String(h.text ?? '').slice(0, 500) }],
        }));
        const contents = [...cappedHistory, { role: 'user', parts: [{ text: userTurnText }] }];
        let cachedContentName = null;
        let contextCacheHit = false;
        if (baseSi) {
            const natalFp = typeof natalFingerprint === 'string' ? natalFingerprint : undefined;
            const instructionKey = this.contextInstructionCacheKey(baseSi, userId, natalFp);
            const entry = this.contextCache.get(instructionKey);
            if (entry && Date.now() < entry.expiresAt) {
                cachedContentName = entry.name;
                contextCacheHit = true;
                console.log('[ContextCache] Hit:', cachedContentName);
            }
            else {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                try {
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                        body: JSON.stringify({
                            model: 'models/gemini-3.1-pro-preview',
                            systemInstruction: { parts: [{ text: baseSi }] },
                            ttl: '3600s',
                            contents: [],
                        }),
                    });
                    const created = await res.json();
                    if (!res.ok) {
                        throw new Error(created?.error?.message || `HTTP ${res.status}`);
                    }
                    const name = created.name;
                    this.contextCache.set(instructionKey, { name, expiresAt: Date.now() + 3500000 });
                    cachedContentName = name;
                    console.log('[ContextCache] Created:', name);
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.warn('[ContextCache] Failed:', msg);
                    cachedContentName = null;
                }
                finally {
                    clearTimeout(timeout);
                }
            }
        }
        const payload = { contents };
        if (cachedContentName) {
            payload.cachedContent = cachedContentName;
        }
        else if (effectiveSi) {
            payload.systemInstruction = { parts: [{ text: effectiveSi }] };
        }
        const genController = new AbortController();
        const genTimeout = setTimeout(() => genController.abort(), GEMINI_GENERATE_TIMEOUT_MS);
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: genController.signal,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            text = this.truncatePreservingSugg(text, String(message || ''));
            const MAX_OUTPUT = 3200;
            if (text && text.length > MAX_OUTPUT) {
                text = this.capChatOutputAtMaxChars(text, MAX_OUTPUT);
            }
            const fromUsage = this.costFromUsageMetadata(data);
            let inputTokens;
            let outputTokens;
            let costUsd;
            if (fromUsage) {
                inputTokens = fromUsage.inputTokens;
                outputTokens = fromUsage.outputTokens;
                costUsd = fromUsage.costUsd;
            }
            else {
                inputTokens = 0;
                outputTokens = 0;
                costUsd = 0;
            }
            if (userId) {
                await this.questionsService
                    .logQuestion({
                    userId,
                    question: userQuestion || message,
                    response: text,
                    language: body.language || 'EN',
                    cacheHit: contextCacheHit,
                    costUsd,
                })
                    .catch(() => { });
            }
            return { text, cacheHit: contextCacheHit, costUsd, inputTokens, outputTokens };
        }
        catch (err) {
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
        }
        finally {
            clearTimeout(genTimeout);
        }
    }
    async generateImage(body) {
        const { prompt, imageParts = [] } = body;
        const parts = imageParts.map((img) => ({
            inlineData: { mimeType: img.mimeType, data: img.data },
        }));
        parts.push({ text: prompt });
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${this.apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_GENERATE_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
                }),
                signal: controller.signal,
            });
        }
        catch (err) {
            if (isAbortError(err)) {
                return { error: 'The model request timed out. Please try again.' };
            }
            throw err;
        }
        finally {
            clearTimeout(timeoutId);
        }
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
};
exports.GeminiService = GeminiService;
exports.GeminiService = GeminiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [questions_service_1.QuestionsService])
], GeminiService);
//# sourceMappingURL=gemini.service.js.map