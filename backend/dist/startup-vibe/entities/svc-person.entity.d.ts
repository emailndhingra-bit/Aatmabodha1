import { SvcSessionEntity } from './svc-session.entity';
export declare class SvcPersonEntity {
    id: string;
    sessionId: string;
    session: SvcSessionEntity;
    displayName: string;
    dob: string;
    tob: string;
    pobCity: string;
    pobLat: string | null;
    pobLon: string | null;
    pobTz: string | null;
    rolePreference: string | null;
    chartJson: Record<string, unknown> | null;
    positionIndex: number;
    createdAt: Date;
}
