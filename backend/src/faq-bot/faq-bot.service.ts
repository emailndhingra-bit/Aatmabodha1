import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';

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

@Injectable()
export class FaqBotService {
  constructor(private readonly geminiService: GeminiService) {}

  async handleMessage(message: string, language: string): Promise<{ reply: string; suggestedChips: string[] }> {
    const prompt = `${FAQ_BOT_PROMPT}\n\nUser preference language hint: ${language}\n\nUser message:\n${message}`;
    const out = await this.geminiService.generateContent(
      {
        prompt,
        responseFormat: 'json',
        maxOutputTokens: 256,
        skipQuestionLog: true,
      },
      undefined,
    );
    const raw = String(out.text || '').trim();
    try {
      const parsed = JSON.parse(raw) as { reply?: string; suggestedChips?: string[] };
      const reply = typeof parsed.reply === 'string' ? parsed.reply : raw;
      const chips = Array.isArray(parsed.suggestedChips)
        ? parsed.suggestedChips.filter((c) => typeof c === 'string' && c.trim()).slice(0, 8)
        : [];
      return { reply, suggestedChips: chips.length ? chips : this.defaultChips() };
    } catch {
      return { reply: raw || 'Sorry — please try again in a moment.', suggestedChips: this.defaultChips() };
    }
  }

  private defaultChips(): string[] {
    return ['Change language', 'Update birth time', 'How many questions left?', 'Add profile'];
  }
}
