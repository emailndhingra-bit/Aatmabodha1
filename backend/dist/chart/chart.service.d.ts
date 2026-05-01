import { Repository } from 'typeorm';
import { ChartRequestEntity } from './chartRequest.entity';
import { CreateChartDto } from './dto/create-chart.dto';
export declare class ChartService {
    private readonly chartReqRepo;
    constructor(chartReqRepo: Repository<ChartRequestEntity>);
    private chartApiUrl;
    private chartTimeoutMs;
    private postChartToReplit;
    fetchChartFresh(body: CreateChartDto, options?: {
        timeoutMs?: number;
    }): Promise<any>;
    createChart(body: CreateChartDto, options?: {
        timeoutMs?: number;
    }): Promise<any>;
}
