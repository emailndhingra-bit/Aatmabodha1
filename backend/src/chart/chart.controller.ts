import { Body, Controller, Post } from '@nestjs/common';
import { CreateChartDto } from './dto/create-chart.dto';
import { ChartService } from './chart.service';

@Controller('chart')
export class ChartController {
  constructor(private readonly chartService: ChartService) {}

  @Post()
  async createChart(@Body() body: CreateChartDto) {
    return await this.chartService.createChart(body);
  }
}

