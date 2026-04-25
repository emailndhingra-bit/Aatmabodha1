import { Repository } from 'typeorm';
import { GeneratedReport } from './generated-report.entity';
export declare class GeneratedReportsService {
    private readonly repo;
    constructor(repo: Repository<GeneratedReport>);
    create(row: Partial<GeneratedReport>): Promise<GeneratedReport>;
    findOne(id: string): Promise<GeneratedReport | null>;
    list(page?: number, limit?: number): Promise<{
        items: GeneratedReport[];
        total: number;
        page: number;
        limit: number;
    }>;
    delete(id: string): Promise<void>;
    getHubStats(): Promise<{
        totalGenerated: number;
        thisMonth: number;
        avgGenerationMin: string;
    }>;
    resolvePdfPath(pdfUrl: string | null): string | null;
}
