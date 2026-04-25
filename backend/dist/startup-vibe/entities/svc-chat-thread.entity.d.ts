import { SvcSessionEntity } from './svc-session.entity';
import { SvcResultEntity } from './svc-result.entity';
export declare class SvcChatThreadEntity {
    id: string;
    sessionId: string;
    session: SvcSessionEntity;
    resultId: string;
    result: SvcResultEntity;
    rulesVersion: string;
    title: string | null;
    summary: string | null;
    messageCount: number;
    createdAt: Date;
    lastMessageAt: Date;
}
