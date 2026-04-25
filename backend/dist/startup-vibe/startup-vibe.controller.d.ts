import { User } from '../users/user.entity';
import { AddPersonDto } from './dto/add-person.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { StartupVibeService } from './startup-vibe.service';
export declare class StartupVibeController {
    private readonly startupVibe;
    constructor(startupVibe: StartupVibeService);
    create(req: {
        user: User;
    }, dto: CreateSessionDto): Promise<{
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
    list(req: {
        user: User;
    }): Promise<{
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
    getOne(req: {
        user: User;
    }, id: string): Promise<{
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
    remove(req: {
        user: User;
    }, id: string): Promise<{
        ok: boolean;
    }>;
    addPerson(req: {
        user: User;
    }, id: string, dto: AddPersonDto): Promise<{
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
    removePerson(req: {
        user: User;
    }, id: string, personId: string): Promise<{
        ok: boolean;
    }>;
}
