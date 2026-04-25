import { ChartService } from '../chart/chart.service';
import { GeminiService } from '../gemini/gemini.service';
import { ProfilesService } from '../profiles/profiles.service';
import { PdfUtilsService } from './pdf-utils.service';
import { GeneratedReport } from './generated-report.entity';
import { GeneratedReportsService } from './generated-reports.service';
export type GenerateReportInput = {
    reportType: string;
    profileIdA: string;
    profileIdB?: string;
    tier?: string;
    language: string;
    flags?: Record<string, unknown>;
};
export declare class ReportGenerationService {
    private readonly profiles;
    private readonly charts;
    private readonly gemini;
    private readonly pdf;
    private readonly generated;
    private readonly logger;
    constructor(profiles: ProfilesService, charts: ChartService, gemini: GeminiService, pdf: PdfUtilsService, generated: GeneratedReportsService);
    private slug;
    private dashaSnippet;
    private chartBlob;
    private loadProfile;
    private fetchChartForProfile;
    generate(input: GenerateReportInput, adminEmail: string): Promise<GeneratedReport>;
}
