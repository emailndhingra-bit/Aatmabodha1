import { BadRequestException, Injectable, RequestTimeoutException } from '@nestjs/common';
import axios from 'axios';
import { ChartService } from '../../chart/chart.service';
import { chartPayloadFromProfileFields } from '../../reports/chart-payload.util';
import { SvcPersonEntity } from '../entities/svc-person.entity';
import { PobResolveService } from './pob-resolve.service';

const NUMERIC_TZ = /^-?\d+(\.\d+)?$/;

@Injectable()
export class ChartFetcherService {
  private static readonly TIMEOUT_MS = 15_000;

  constructor(
    private readonly chartService: ChartService,
    private readonly pobResolve: PobResolveService,
  ) {}

  async fetchChartForPerson(person: SvcPersonEntity): Promise<Record<string, unknown>> {
    const tob = (person.tob || '').trim();
    if (!tob) {
      throw new BadRequestException('Time of birth is required');
    }
    const lat = person.pobLat != null ? Number(person.pobLat) : Number.NaN;
    const lon = person.pobLon != null ? Number(person.pobLon) : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Latitude and longitude are required before chart fetch');
    }
    const tzRaw = person.pobTz?.trim();
    if (!tzRaw) {
      throw new BadRequestException('Timezone is required before chart fetch');
    }
    const tobNorm = this.normalizeTob(tob);
    const tzNum = NUMERIC_TZ.test(tzRaw)
      ? parseFloat(tzRaw)
      : this.pobResolve.offsetHoursAtLocalWallClock(tzRaw, person.dob, tobNorm);
    if (!Number.isFinite(tzNum)) {
      throw new BadRequestException('Invalid timezone for chart fetch');
    }

    const payload = chartPayloadFromProfileFields({
      dateOfBirth: person.dob,
      timeOfBirth: tobNorm,
      latitude: lat,
      longitude: lon,
      timezone: tzNum,
    });

    try {
      const data = await this.chartService.createChart(
        {
          date_of_birth: payload.date_of_birth,
          time_of_birth: payload.time_of_birth,
          latitude: payload.latitude,
          longitude: payload.longitude,
          timezone: String(payload.timezone),
        },
        { timeoutMs: ChartFetcherService.TIMEOUT_MS },
      );
      return data as Record<string, unknown>;
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.code === 'ECONNABORTED') {
        throw new RequestTimeoutException('Chart service timed out');
      }
      throw e;
    }
  }

  private normalizeTob(tob: string): string {
    const [h, m] = tob.split(':');
    const hh = String(Number(h)).padStart(2, '0');
    const mm = String(Number(m ?? 0)).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
