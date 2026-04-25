import { Repository } from 'typeorm';
import { QuestionLog } from './question-log.entity';
export declare class QuestionsService {
    private repo;
    private hasNullified;
    constructor(repo: Repository<QuestionLog>);
    hashUser(userId: string): string;
    estimateCost(inputTokens: number, outputTokens: number): number;
    estimateTokens(text: string): number;
    private categorizeQuestion;
    private detectQuestionIntent;
    private detectEmotionalTone;
    logQuestion(data: {
        userId: string;
        question: string;
        response: string;
        language?: string;
        cacheHit?: boolean;
        costUsd?: number;
        sessionId?: string;
        chartContext?: {
            userMoonSign?: string;
            userLagna?: string;
            userAtmakaraka?: string;
            userSadeSati?: boolean;
            userDashaType?: string;
            ageGroup?: string;
            dashaAtTime?: string;
        };
    }): Promise<QuestionLog>;
    nullifyQuestionText(): Promise<void>;
    getAdminQuestions(limit?: number): Promise<any[]>;
    categorizeAllExisting(): Promise<void>;
    getStats(): Promise<any>;
    getRecentQuestions(limit?: number): Promise<QuestionLog[]>;
    getRecentByUser(userId: string, limit?: number): Promise<Pick<QuestionLog, 'questionText' | 'createdAt' | 'language'>[]>;
}
