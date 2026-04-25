export declare class QuestionLog {
    id: string;
    userHash: string;
    questionText: string | null;
    responsePreview: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    language: string;
    cacheHit: boolean;
    questionCategory: string;
    questionIntent: string;
    emotionalTone: string;
    sessionDepth: number | null;
    sessionId: string;
    prevCategory: string;
    returnedAfterDays: number | null;
    dashaAtTime: string;
    moonSignAtTime: string;
    transitsSnapshot: string;
    userMoonSign: string;
    userLagna: string;
    userAtmakaraka: string;
    userSadeSati: boolean | null;
    userDashaType: string;
    ageGroup: string;
    createdAt: Date;
}
