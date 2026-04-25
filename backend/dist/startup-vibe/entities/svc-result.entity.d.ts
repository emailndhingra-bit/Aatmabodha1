import { SvcSessionEntity } from './svc-session.entity';
export declare class SvcResultEntity {
    id: string;
    sessionId: string;
    session: SvcSessionEntity;
    rulesVersion: string;
    resultJson: Record<string, unknown>;
    generatedAt: Date;
    generationMs: number | null;
    cacheHit: boolean;
}
