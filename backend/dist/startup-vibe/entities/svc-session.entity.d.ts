import { SvcPersonEntity } from './svc-person.entity';
export declare class SvcSessionEntity {
    id: string;
    adminUserId: string;
    label: string;
    industry: string | null;
    stage: string | null;
    fundingStatus: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    people: SvcPersonEntity[];
}
