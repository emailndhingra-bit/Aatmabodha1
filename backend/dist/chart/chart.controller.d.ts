import { CreateChartDto } from './dto/create-chart.dto';
import { ChartService } from './chart.service';
export declare class ChartController {
    private readonly chartService;
    constructor(chartService: ChartService);
    createChart(body: CreateChartDto): Promise<any>;
    refreshChart(body: CreateChartDto): Promise<any>;
}
