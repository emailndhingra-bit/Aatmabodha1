import { GeminiService } from '../gemini/gemini.service';
export declare class FaqBotService {
    private readonly geminiService;
    constructor(geminiService: GeminiService);
    handleMessage(message: string, language: string): Promise<{
        reply: string;
        suggestedChips: string[];
    }>;
    private defaultChips;
}
