import { Repository } from 'typeorm';
import { Report } from './report.entity';
export declare class ReportsService {
    private readonly repo;
    constructor(repo: Repository<Report>);
    logReport(userId: string, profileName: string, reportType: string, title: string, content: string, language: string): Promise<Report>;
    getAdminReports(page?: number, limit?: number, reportType?: string): Promise<{
        items: Report[];
        total: number;
        page: number;
        limit: number;
    }>;
    getReportsByUser(userId: string): Promise<Report[]>;
    getReportStats(): Promise<{
        countByType: {
            reportType: string;
            count: string;
        }[];
        countToday: number;
        countThisWeek: number;
    }>;
    private getStartOfWeekMonday;
}
