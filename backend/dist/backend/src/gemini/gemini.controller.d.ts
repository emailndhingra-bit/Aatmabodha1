import { GeminiService } from './gemini.service';
import { QuestionsService } from '../questions/questions.service';
import { ReportsService } from '../reports/reports.service';
import { UsersService } from '../users/users.service';
export declare class GeminiController {
    private readonly geminiService;
    private readonly questionsService;
    private readonly reportsService;
    private readonly usersService;
    constructor(geminiService: GeminiService, questionsService: QuestionsService, reportsService: ReportsService, usersService: UsersService);
    geminiProxy(body: any, req: any): Promise<any>;
    geminiChat(body: any, req: any): Promise<any>;
    geminiImage(body: any): Promise<any>;
    getStats(): Promise<any>;
    getAdminReportStats(): Promise<{
        totalReports: number;
        todayCount: number;
        weekCount: number;
        countByType: Record<string, number>;
    }>;
    getAdminReports(page?: string, limit?: string, type?: string): Promise<{
        page: number;
        limit: number;
        total: number;
        items: {
            id: string;
            userId: string;
            profileName: string;
            reportType: string;
            title: string;
            contentPreview: string;
            language: string;
            createdAt: Date;
        }[];
    }>;
}
