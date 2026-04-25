import { QuestionsService } from '../questions/questions.service';
export declare class GeminiService {
    private questionsService;
    private readonly apiKey;
    private readonly model;
    private readonly inflightRequests;
    private readonly contextCache;
    constructor(questionsService: QuestionsService);
    private contextInstructionCacheKey;
    private costFromUsageMetadata;
    private truncatePreservingSugg;
    private capChatOutputAtMaxChars;
    generateContent(body: any, userId?: string): Promise<any>;
    chat(body: any, userId?: string): Promise<any>;
    generateImage(body: any): Promise<any>;
    getCacheStats(): {
        size: number;
        maxSize: number;
        ttlHours: number;
        note: string;
    };
}
