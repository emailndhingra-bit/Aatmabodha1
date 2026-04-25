import { ChartsService } from './charts.service';
export declare class ChartsController {
    private readonly chartsService;
    constructor(chartsService: ChartsService);
    getCharts(req: {
        user: {
            email: string;
        };
    }): Promise<import("./saved-chart.entity").SavedChart[]>;
    saveChart(req: {
        user: {
            email: string;
        };
    }, body: any): Promise<import("./saved-chart.entity").SavedChart>;
    deleteChart(req: {
        user: {
            email: string;
        };
    }, id: string): Promise<void>;
    togglePin(req: {
        user: {
            email: string;
        };
    }, id: string): Promise<void>;
    updateChart(req: {
        user: {
            email: string;
        };
    }, id: string, body: any): Promise<void>;
}
