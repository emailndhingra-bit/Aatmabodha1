import { Repository } from 'typeorm';
import { AddPersonDto } from './dto/add-person.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ChartFetcherService } from './analysis/chart-fetcher.service';
import { PobResolveService } from './analysis/pob-resolve.service';
import { SvcPersonEntity } from './entities/svc-person.entity';
import { SvcSessionEntity } from './entities/svc-session.entity';
export declare class StartupVibeService {
    private readonly sessions;
    private readonly people;
    private readonly pobResolve;
    private readonly chartFetcher;
    constructor(sessions: Repository<SvcSessionEntity>, people: Repository<SvcPersonEntity>, pobResolve: PobResolveService, chartFetcher: ChartFetcherService);
    createSession(adminUserId: string, dto: CreateSessionDto): Promise<{
        id: string;
        adminUserId: string;
        label: string;
        industry: string;
        stage: string;
        fundingStatus: string;
        notes: string;
        createdAt: Date;
        updatedAt: Date;
        team_size: number;
        last_analysed: string;
        people: {
            id: string;
            sessionId: string;
            displayName: string;
            dob: string;
            tob: string;
            pobCity: string;
            pobLat: number;
            pobLon: number;
            pobTz: string;
            rolePreference: string;
            chartJson: Record<string, unknown>;
            positionIndex: number;
            createdAt: Date;
        }[];
    }>;
    listSessions(adminUserId: string): Promise<{
        id: string;
        adminUserId: string;
        label: string;
        industry: string;
        stage: string;
        fundingStatus: string;
        notes: string;
        createdAt: Date;
        updatedAt: Date;
        team_size: number;
        last_analysed: string;
        people: {
            id: string;
            sessionId: string;
            displayName: string;
            dob: string;
            tob: string;
            pobCity: string;
            pobLat: number;
            pobLon: number;
            pobTz: string;
            rolePreference: string;
            chartJson: Record<string, unknown>;
            positionIndex: number;
            createdAt: Date;
        }[];
    }[]>;
    getSession(adminUserId: string, id: string): Promise<{
        id: string;
        adminUserId: string;
        label: string;
        industry: string;
        stage: string;
        fundingStatus: string;
        notes: string;
        createdAt: Date;
        updatedAt: Date;
        team_size: number;
        last_analysed: string;
        people: {
            id: string;
            sessionId: string;
            displayName: string;
            dob: string;
            tob: string;
            pobCity: string;
            pobLat: number;
            pobLon: number;
            pobTz: string;
            rolePreference: string;
            chartJson: Record<string, unknown>;
            positionIndex: number;
            createdAt: Date;
        }[];
    }>;
    deleteSession(adminUserId: string, id: string): Promise<{
        ok: boolean;
    }>;
    addPerson(adminUserId: string, sessionId: string, dto: AddPersonDto, fixedIndex?: number): Promise<{
        person: {
            id: string;
            sessionId: string;
            displayName: string;
            dob: string;
            tob: string;
            pobCity: string;
            pobLat: number;
            pobLon: number;
            pobTz: string;
            rolePreference: string;
            chartJson: Record<string, unknown>;
            positionIndex: number;
            createdAt: Date;
        };
        chart_status: "ok" | "failed";
    }>;
    deletePerson(adminUserId: string, sessionId: string, personId: string): Promise<{
        ok: boolean;
    }>;
    private assertOwner;
    private touchSession;
    private serializePerson;
    private decorateSession;
}
