import { ChartService } from '../chart/chart.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';
import { GeminiService } from '../gemini/gemini.service';
import { SarvamService } from '../sarvam/sarvam.service';
import { AdminQuickChartDto } from './dto/admin-quick-chart.dto';
import { AdminOracleAudioDto } from './dto/admin-oracle-audio.dto';
export declare class AdminService {
    private readonly chartService;
    private readonly profilesService;
    private readonly usersService;
    private readonly geminiService;
    private readonly sarvamService;
    constructor(chartService: ChartService, profilesService: ProfilesService, usersService: UsersService, geminiService: GeminiService, sarvamService: SarvamService);
    quickChart(admin: {
        id: string;
    }, dto: AdminQuickChartDto): Promise<{
        chart: any;
        profile: unknown;
    }>;
    listUsersForAdmin(): Promise<Array<{
        id: string;
        email: string;
        name: string | null;
        status: string;
        picture: string | null;
        questionsUsed: number;
        questionsLimit: number;
        customQuota: number | null;
        current_quota: number;
        quota_source: 'custom' | 'default';
        createdAt: Date;
        updatedAt: Date;
    }>>;
    private toAdminUserRow;
    setUserQuota(userId: string, quota: number): Promise<{
        id: string;
        email: string;
        name: string;
        status: import("../users/user.entity").UserStatus;
        picture: string;
        questionsUsed: number;
        questionsLimit: number;
        customQuota: number;
        current_quota: number;
        quota_source: "default" | "custom";
        createdAt: Date;
        updatedAt: Date;
    }>;
    oracleAudio(dto: AdminOracleAudioDto): Promise<{
        text: string;
        audioBase64: string;
        language: string;
    }>;
}
