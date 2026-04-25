import { ChartService } from '../../chart/chart.service';
import { SvcPersonEntity } from '../entities/svc-person.entity';
import { PobResolveService } from './pob-resolve.service';
export declare class ChartFetcherService {
    private readonly chartService;
    private readonly pobResolve;
    private static readonly TIMEOUT_MS;
    constructor(chartService: ChartService, pobResolve: PobResolveService);
    fetchChartForPerson(person: SvcPersonEntity): Promise<Record<string, unknown>>;
    private normalizeTob;
}
