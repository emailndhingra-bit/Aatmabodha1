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

  async createChart(body: CreateChartDto) {
    const rec = this.chartReqRepo.create({
      requestBody: body,
      responseBody: null,
      errorMessage: null,
    });
    await this.chartReqRepo.save(rec);

    try {
      const baseUrl =
        process.env.CHART_API_URL ?? 'https://flask-creator-nitingauri2008.replit.app';
        const url = `${baseUrl.replace(/\/$/, '')}/api/chart`;        
      const res = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: process.env.CHART_API_TIMEOUT_MS
          ? Number(process.env.CHART_API_TIMEOUT_MS)
          : 60_000,
      });

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

