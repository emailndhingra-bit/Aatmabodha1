import { SvcChatThreadEntity } from './svc-chat-thread.entity';
export declare class SvcChatMessageEntity {
    id: string;
    threadId: string;
    thread: SvcChatThreadEntity;
    role: string;
    content: string;
    scopePersonIds: string[] | null;
    scopeKind: string | null;
    hypotheticalNote: string | null;
    tokensIn: number | null;
    tokensOut: number | null;
    cacheHit: boolean;
    generationMs: number | null;
    createdAt: Date;
}
