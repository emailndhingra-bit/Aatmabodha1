import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedChart } from './saved-chart.entity';

@Injectable()
export class ChartsService {
  constructor(
    @InjectRepository(SavedChart)
    private repo: Repository<SavedChart>,
  ) {}

  async saveChart(
    adminEmail: string,
    data: {
      chartName: string;
      chartType: string;
      chartConfig: string;
      description?: string;
      xAxis?: string;
      yAxis?: string;
      groupBy?: string;
    },
  ): Promise<SavedChart> {
    const chart = this.repo.create({
      adminEmail,
      ...data,
    });
    return this.repo.save(chart);
  }

  async getCharts(adminEmail: string): Promise<SavedChart[]> {
    return this.repo.find({
      where: { adminEmail },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async deleteChart(id: string, adminEmail: string): Promise<void> {
    await this.repo.delete({ id, adminEmail });
  }

  async togglePin(id: string, adminEmail: string): Promise<void> {
    const chart = await this.repo.findOne({
      where: { id, adminEmail },
    });
    if (chart) {
      chart.isPinned = !chart.isPinned;
      await this.repo.save(chart);
    }
  }

  async updateChart(
    id: string,
    adminEmail: string,
    data: {
      chartName?: string;
      chartConfig?: string;
      description?: string;
    },
  ): Promise<void> {
    await this.repo.update({ id, adminEmail }, data);
  }
}
