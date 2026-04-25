import { ReportsService } from './reports.service';
import { LogReportDto } from './dto/log-report.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getMyReports(req: any): Promise<import("./report.entity").Report[]>;
    logReport(req: any, body: LogReportDto): Promise<import("./report.entity").Report>;
}
