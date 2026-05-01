import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartRequestEntity } from './chartRequest.entity';
import { CreateChartDto } from './dto/create-chart.dto';

@Injectable()
export class ChartService {
  constructor(
    @InjectRepository(ChartRequestEntity)
    private readonly chartReqRepo: Repository<ChartRequestEntity>,
  ) {}

  private chartApiUrl(): string {
    const baseUrl =
      process.env.CHART_API_URL ?? 'https://flask-creator-nitingauri2008.replit.app';
    return `${baseUrl.replace(/\/$/, '')}/api/chart`;
  }

  private chartTimeoutMs(options?: { timeoutMs?: number }): number {
    return (
      options?.timeoutMs ??
      (process.env.CHART_API_TIMEOUT_MS ? Number(process.env.CHART_API_TIMEOUT_MS) : 60_000)
    );
  }

  private async postChartToReplit(
    body: CreateChartDto,
    options?: { timeoutMs?: number },
  ) {
    return axios.post(this.chartApiUrl(), body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: this.chartTimeoutMs(options),
    });
  }

  async fetchChartFresh(
    body: CreateChartDto,
    options?: { timeoutMs?: number },
  ) {
    const res = await this.postChartToReplit(body, options);
    return res.data;
  }

  /** Raw HTTP body from Replit chart API (preserves exact JSON bytes when server returns JSON). */
  async fetchReplitResponseAsText(
    body: CreateChartDto,
    options?: { timeoutMs?: number },
  ): Promise<string> {
    const res = await axios.post<string>(this.chartApiUrl(), body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: this.chartTimeoutMs(options),
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return typeof res.data === 'string' ? res.data : String(res.data ?? '');
  }

  async createChart(
    body: CreateChartDto,
    options?: { timeoutMs?: number },
  ) {
    const rec = this.chartReqRepo.create({
      requestBody: body,
      responseBody: null,
      errorMessage: null,
    });
    await this.chartReqRepo.save(rec);

    try {
      const res = await this.postChartToReplit(body, options);

      rec.responseBody = res.data;
      await this.chartReqRepo.save(rec);
      return res.data;
    } catch (e: any) {
      rec.errorMessage = e?.message ? String(e.message) : 'Unknown error';
      await this.chartReqRepo.save(rec);
      throw e;
    }
  }
}

