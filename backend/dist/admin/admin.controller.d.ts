import type { Response } from 'express';
import { AdminService } from './admin.service';
import { AdminQuickChartDto } from './dto/admin-quick-chart.dto';
import { AdminOracleAudioDto } from './dto/admin-oracle-audio.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    quickChart(req: any, body: AdminQuickChartDto): Promise<{
        chart: any;
        profile: unknown;
    }>;
    listUsers(): Promise<{
        id: string;
        email: string;
        name: string | null;
        status: string;
        picture: string | null;
        questionsUsed: number;
        questionsLimit: number;
        customQuota: number | null;
        current_quota: number;
        quota_source: "custom" | "default";
        createdAt: Date;
        updatedAt: Date;
        lastQuestionAt: Date | null;
    }[]>;
    patchQuota(userId: string, body: UpdateQuotaDto): Promise<{
        id: string;
        email: string;
        name: string;
        status: import("../users/user.entity").UserStatus;
        picture: string;
        questionsUsed: number;
        questionsLimit: number;
        customQuota: number;
        current_quota: number;
        quota_source: "custom" | "default";
        createdAt: Date;
        updatedAt: Date;
    }>;
    exportReplit(userId: string, profileId: string, res: Response): Promise<void>;
    oracleAudio(body: AdminOracleAudioDto): Promise<{
        text: string;
        audioBase64: string;
        language: string;
    }>;
}
