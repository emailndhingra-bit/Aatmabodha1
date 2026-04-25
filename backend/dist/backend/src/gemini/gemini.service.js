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
const oracleRules_1 = require("../../../services/oracleRules");
const questions_service_1 = require("../questions/questions.service");
const GEMINI_GENERATE_TIMEOUT_MS = 160000;
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
        this.contextCache.clear();
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
        const contentHash = (0, crypto_1.createHash)('sha256')
            .update(stableContent)
            .digest('hex')
            .substring(0, 16);
        const prefix = `${userId ?? 'anon'}\x1e${(natalFingerprint ?? '').trim()}\x1e${oracleRules_1.ORACLE_RULES_VERSION}\x1e${contentHash}\x1e`;
        return (0, crypto_1.createHash)('sha256').update(prefix).digest('hex');
    }
    cachedContentExpireMs(c) {
        const et = c?.expireTime;
        if (typeof et === 'string' && et) {
            const ms = new Date(et).getTime();
            return Number.isFinite(ms) ? ms : 0;
        }
        if (et && typeof et === 'object' && et.seconds != null) {
            const s = typeof et.seconds === 'string' ? parseInt(et.seconds, 10) : Number(et.seconds);
            const n = typeof et.nanos === 'number' ? et.nanos / 1e6 : 0;
            return Number.isFinite(s) ? s * 1000 + n : 0;
        }
        return 0;
    }
    stripChartDataFromUserMessage(message) {
        if (typeof message !== 'string' || !message.trim()) {
            return { messageWithoutChart: message, chartBlock: null };
        }
        const re = /\[\s*CHART_DATA\s*\][\s\S]*?\[\s*\/\s*CHART_DATA\s*\]/i;
        const match = message.match(re);
        if (!match) {
            return { messageWithoutChart: message, chartBlock: null };
        }
        const chartBlock = match[0].trim();
        const messageWithoutChart = message
            .replace(re, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return { messageWithoutChart, chartBlock };
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
        const cachedInputCost = (cachedTokens * 0.2) / 1e6;
        const uncachedInputCost = (Math.max(0, inputTokens - cachedTokens) * 2.0) / 1e6;
        const outputCost = (outputTokens * 12.0) / 1e6;
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
            if (!body.skipOutputTruncate) {
                text = this.truncatePreservingSugg(text, String(prompt || ''));
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
            if (userId && !body.skipQuestionLog) {
                await this.questionsService
                    .logQuestion({
                    userId,
                    question: prompt,
                    response: text,
                    language: body.language,
                    cacheHit: false,
                    costUsd,
                    chartContext: body.chartContext ?? undefined,
                })
                    .catch(() => { });
            }
            return { text, cacheHit: false, costUsd, inputTokens, outputTokens };
        };
        if (imageParts.length > 0 || body.skipInflightDedup) {
            return run();
        }
        let p = this.inflightRequests.get(inflightKey);
        if (!p) {
            p = run().finally(() => this.inflightRequests.delete(inflightKey));
            this.inflightRequests.set(inflightKey, p);
        }
        return p;
    }
    buildHistorySummary(history) {
        if (!history || history.length === 0)
            return '';
        const turns = history.slice(-6);
        const topics = [];
        const predictions = [];
        const vetoes = [];
        const hooks = [];
        for (const turn of turns) {
            if (turn.role !== 'assistant' && turn.role !== 'model')
                continue;
            const text = String(turn.text ?? '');
            const refMatches = text.match(/\[([TSHVJRCDMG]\d+)\]/g) ?? [];
            if (refMatches.length > 0) {
                topics.push(refMatches.slice(0, 3).join(' '));
            }
            const predMatches = text.match(/\d{1,3}%[^.]{0,80}/g) ?? [];
            predictions.push(...predMatches.slice(0, 2));
            if (/bilkul mat pehno|veto|mat karo/i.test(text)) {
                const veto = text.match(/([A-Z][a-z]+(?:\s+\([^)]+\))?)\s+(?:abhi\s+)?bilkul mat/);
                if (veto)
                    vetoes.push(veto[0]);
            }
            const hookMatch = text.match(/([^.]{20,150}\?)\s*$/);
            if (hookMatch)
                hooks.push(hookMatch[1].trim());
        }
        const parts = [];
        if (topics.length > 0)
            parts.push(`Topics: ${topics.slice(0, 5).join(', ')}`);
        if (predictions.length > 0)
            parts.push(`Predictions: ${predictions.slice(0, 3).join('; ')}`);
        if (vetoes.length > 0)
            parts.push(`Vetoed: ${vetoes.slice(0, 3).join(', ')}`);
        if (hooks.length > 0)
            parts.push(`Open threads: ${hooks[hooks.length - 1]}`);
        if (parts.length === 0)
            return '';
        const summary = `[Prior conversation summary]\n${parts.join('\n')}\n[End summary]`;
        const maxLen = 1500;
        if (summary.length <= maxLen)
            return summary;
        return summary.slice(0, maxLen - 3) + '...';
    }
    async chat(body, userId) {
        const { systemInstruction, history = [], message, userQuestion, natalFingerprint, pastContext } = body;
        const { messageWithoutChart, chartBlock } = this.stripChartDataFromUserMessage(typeof message === 'string' ? message : '');
        const past = typeof pastContext === 'string' && pastContext.trim().length > 0
            ? pastContext.trim()
            : '';
        let baseSi = typeof systemInstruction === 'string' ? systemInstruction : '';
        if (chartBlock) {
            baseSi = baseSi ? `${baseSi}\n\n${chartBlock}` : chartBlock;
        }
        const effectiveSi = baseSi;
        const userTurnText = past
            ? `${messageWithoutChart}\n\n[PAST CONTEXT - user's recent questions for continuity:\n${past}\nReference naturally, never say "as per last conversation".]`
            : messageWithoutChart;
        const rawHistory = Array.isArray(history) ? history : [];
        const historySummary = this.buildHistorySummary(rawHistory);
        const userMessageWithSummary = historySummary.length > 0
            ? `${historySummary}\n\n---\n\n${userTurnText}`
            : userTurnText;
        const contents = [{ role: 'user', parts: [{ text: userMessageWithSummary }] }];
        let cachedContentName = null;
        let contextCacheHit = false;
        let instructionKey = null;
        if (baseSi) {
            const natalFp = typeof natalFingerprint === 'string' ? natalFingerprint : undefined;
            instructionKey = this.contextInstructionCacheKey(baseSi, userId, natalFp);
            const entry = this.contextCache.get(instructionKey);
            if (entry && Date.now() < entry.expiresAt) {
                cachedContentName = entry.name;
                contextCacheHit = true;
                console.log('[ContextCache] Hit (memory):', cachedContentName);
            }
            else {
                const listCtl = new AbortController();
                const listTo = setTimeout(() => listCtl.abort(), 3000);
                try {
                    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${this.apiKey}&pageSize=50`, { method: 'GET', signal: listCtl.signal });
                    const listData = await listRes.json();
                    if (listRes.ok) {
                        const items = Array.isArray(listData?.cachedContents)
                            ? listData.cachedContents
                            : [];
                        const minExp = Date.now() + 60000;
                        const existing = items.find((c) => {
                            if (c?.displayName !== instructionKey || !c?.name)
                                return false;
                            return this.cachedContentExpireMs(c) > minExp;
                        });
                        if (existing) {
                            const expMs = this.cachedContentExpireMs(existing);
                            cachedContentName = existing.name;
                            contextCacheHit = true;
                            this.contextCache.set(instructionKey, {
                                name: cachedContentName,
                                expiresAt: expMs > 0 ? expMs : Date.now() + 3500000,
                            });
                            console.log('[ContextCache] Hit (Gemini recovered):', cachedContentName);
                        }
                    }
                }
                catch {
                }
                finally {
                    clearTimeout(listTo);
                }
                if (!cachedContentName) {
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
                                displayName: instructionKey,
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
        const t0 = Date.now();
        const diagUserQ = String(body.userQuestion ?? messageWithoutChart ?? '').slice(0, 100);
        console.log('[OracleDiag] about to call Gemini', {
            cacheHit: contextCacheHit,
            cacheId: cachedContentName,
            cachedLength: baseSi ? baseSi.length : 0,
            dynamicLength: JSON.stringify(contents).length,
            userQuestion: diagUserQ,
            historySummaryLength: historySummary?.length ?? 0,
            historyTurnCount: rawHistory?.length ?? 0,
            rulesVersion: oracleRules_1.ORACLE_RULES_VERSION,
            cacheKeyPrefix: instructionKey ? instructionKey.substring(0, 8) : '',
        });
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: genController.signal,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            const rawOut = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            console.log('[OracleDiag] Gemini returned', {
                ms: Date.now() - t0,
                outputLength: typeof rawOut === 'string' ? rawOut.length : 0,
                finishReason: data?.candidates?.[0]?.finishReason,
                httpOk: res.ok,
            });
            if (data?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
                console.warn('[OracleDiag] Response hit maxOutputTokens cap', {
                    outputLength: rawOut?.length ?? 0,
                    userQuestion: diagUserQ,
                });
            }
            let text = rawOut;
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
                    chartContext: body.chartContext ?? undefined,
                })
                    .catch(() => { });
            }
            return { text, cacheHit: contextCacheHit, costUsd, inputTokens, outputTokens };
        }
        catch (err) {
            const e = err;
            console.error('[OracleDiag] Gemini failed', {
                ms: Date.now() - t0,
                name: e?.name,
                message: e?.message,
                code: e?.code,
                cause: e?.cause,
            });
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