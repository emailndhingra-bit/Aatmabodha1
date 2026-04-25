import { Repository } from 'typeorm';
import { SavedChart } from './saved-chart.entity';
export declare class ChartsService {
    private repo;
    constructor(repo: Repository<SavedChart>);
    saveChart(adminEmail: string, data: {
        chartName: string;
        chartType: string;
        chartConfig: string;
        description?: string;
        xAxis?: string;
        yAxis?: string;
        groupBy?: string;
    }): Promise<SavedChart>;
    getCharts(adminEmail: string): Promise<SavedChart[]>;
    deleteChart(id: string, adminEmail: string): Promise<void>;
    togglePin(id: string, adminEmail: string): Promise<void>;
    updateChart(id: string, adminEmail: string, data: {
        chartName?: string;
        chartConfig?: string;
        description?: string;
    }): Promise<void>;
}
