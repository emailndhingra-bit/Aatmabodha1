export declare class QuestionLog {
    id: string;
    userHash: string;
    questionText: string;
    responsePreview: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    language: string;
    cacheHit: boolean;
    createdAt: Date;
}
