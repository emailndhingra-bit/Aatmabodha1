import { FaqBotService } from './faq-bot.service';
declare class FaqBotMessageDto {
    message: string;
    userId: string;
    language: string;
}
export declare class FaqBotController {
    private readonly faqBotService;
    constructor(faqBotService: FaqBotService);
    message(req: any, body: FaqBotMessageDto): Promise<{
        reply: string;
        suggestedChips: string[];
    }>;
}
export {};
