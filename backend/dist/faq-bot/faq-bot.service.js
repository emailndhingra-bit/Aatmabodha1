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
exports.FaqBotService = void 0;
const common_1 = require("@nestjs/common");
const gemini_service_1 = require("../gemini/gemini.service");
const FAQ_KNOWLEDGE = `
APP HELP KNOWLEDGE (facts only):
- Language: open language / culture toggles in the header (EN / HI). Some labels switch with culture mode.
- Chart / birth update: Profile → Edit birth details (or re-enter on the home birth form) then regenerate chart.
- Questions left: shown in the header as X / cap when a quota applies. Default monthly cap is 60 unless an admin sets a custom quota. Unlimited accounts show differently (admin-set 0).
- Add profile: use profile / account flows to add a second nativity where the product allows multiple profiles.
- Quota reset: monthly reset is on the 1st of the month (product default).
- Export data: Settings → Download my data (Save Vault / export flows in the app header where available).
- Delete account: Settings → Delete account when offered.
`;
const FAQ_BOT_PROMPT = `
You are Aatmabodha's helpful support assistant.
You ONLY answer questions about:
- How to use the app
- Settings and features
- Language preferences
- Profile and chart management
- Question quotas and limits
- Technical issues

You NEVER give astrological readings.
You NEVER answer about destiny, future, planets, dasha, transits, marriage timing, career predictions.
If asked astrology → redirect warmly:
"Oracle section ke liye jaao — woh tumhari chart ki baat karega. Main sirf app help karta hoon."

${FAQ_KNOWLEDGE}

LANGUAGE: Match the user's language automatically (English / Hindi / Hinglish as appropriate).
TONE: Friendly, brief, helpful.
LENGTH: Max 3-4 short sentences for "reply".

OUTPUT FORMAT: Return ONLY valid JSON (no markdown fences) with this exact shape:
{"reply":"string","suggestedChips":["string","string","string"]}
suggestedChips: 3 to 6 short chip labels the user can tap next (e.g. "Change language", "Update birth time").
`;
let FaqBotService = class FaqBotService {
    constructor(geminiService) {
        this.geminiService = geminiService;
    }
    async handleMessage(message, language) {
        const prompt = `${FAQ_BOT_PROMPT}\n\nUser preference language hint: ${language}\n\nUser message:\n${message}`;
        const out = await this.geminiService.generateContent({
            prompt,
            responseFormat: 'json',
            maxOutputTokens: 256,
            skipQuestionLog: true,
        }, undefined);
        const raw = String(out.text || '').trim();
        try {
            const parsed = JSON.parse(raw);
            const reply = typeof parsed.reply === 'string' ? parsed.reply : raw;
            const chips = Array.isArray(parsed.suggestedChips)
                ? parsed.suggestedChips.filter((c) => typeof c === 'string' && c.trim()).slice(0, 8)
                : [];
            return { reply, suggestedChips: chips.length ? chips : this.defaultChips() };
        }
        catch {
            return { reply: raw || 'Sorry — please try again in a moment.', suggestedChips: this.defaultChips() };
        }
    }
    defaultChips() {
        return ['Change language', 'Update birth time', 'How many questions left?', 'Add profile'];
    }
};
exports.FaqBotService = FaqBotService;
exports.FaqBotService = FaqBotService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService])
], FaqBotService);
//# sourceMappingURL=faq-bot.service.js.map