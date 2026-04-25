import { Response } from 'express';
import { GenerateAdminReportDto } from './dto/generate-admin-report.dto';
import { GeneratedReportsService } from './generated-reports.service';
import { ReportGenerationService } from './report-generation.service';
import { ProfilesService } from '../profiles/profiles.service';
import { ChartService } from '../chart/chart.service';
export declare class ReportsHubController {
    private readonly generated;
    private readonly generation;
    private readonly profiles;
    private readonly charts;
    constructor(generated: GeneratedReportsService, generation: ReportGenerationService, profiles: ProfilesService, charts: ChartService);
    stats(): Promise<{
        totalGenerated: number;
        thisMonth: number;
        avgGenerationMin: string;
    }>;
    listProfiles(search?: string): Promise<{
        id: string;
        name: string;
        dateOfBirth: string;
        timeOfBirth: string;
        placeOfBirth: string | null;
        userId: string;
        ownerEmail: string | null;
    }[]>;
    profileChart(profileId: string): Promise<any>;
    list(page?: string, limit?: string): Promise<{
        page: number;
        limit: number;
        total: number;
        items: {
            id: string;
            reportType: string;
            person: string;
            generated: Date;
            pages: number;
            pdfUrl: string;
            language: string;
            tier: string;
        }[];
    }>;
    private personLabel;
    generate(req: any, body: GenerateAdminReportDto): Promise<{
        id: string;
        pdfUrl: string;
        pageCount: number;
        generationDurationMs: number;
    }>;
    downloadPdf(id: string, res: Response): Promise<void>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    regenerate(req: any, id: string): Promise<{
        id: string;
        pdfUrl: string;
        pageCount: number;
        generationDurationMs: number;
    }>;
}
