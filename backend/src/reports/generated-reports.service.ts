import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GeneratedReport } from './generated-report.entity';

@Injectable()
export class GeneratedReportsService {
  constructor(
    @InjectRepository(GeneratedReport)
    private readonly repo: Repository<GeneratedReport>,
  ) {}

  async create(row: Partial<GeneratedReport>): Promise<GeneratedReport> {
    const e = this.repo.create(row);
    return this.repo.save(e);
  }

  async findOne(id: string): Promise<GeneratedReport | null> {
    return this.repo.findOne({ where: { id } });
  }

  async list(page = 1, limit = 20): Promise<{ items: GeneratedReport[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }

  async delete(id: string): Promise<void> {
    const row = await this.findOne(id);
    if (!row) throw new NotFoundException('Report not found');
    if (row.pdfUrl) {
      const full = path.join(process.cwd(), 'uploads', row.pdfUrl);
      await fs.unlink(full).catch(() => {});
    }
    await this.repo.delete(id);
  }

  async getHubStats(): Promise<{
    totalGenerated: number;
    thisMonth: number;
    avgGenerationMin: string;
  }> {
    const totalGenerated = await this.repo.count();
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);
    const thisMonth = await this.repo.count({
      where: { createdAt: MoreThanOrEqual(startMonth) },
    });
    const raw = await this.repo
      .createQueryBuilder('g')
      .select('AVG(g.generationDurationMs)', 'avg')
      .where('g.generationDurationMs IS NOT NULL')
      .getRawOne<{ avg: string | null }>();
    const avgMs = parseFloat(String(raw?.avg ?? '0')) || 0;
    const avgGenerationMin = avgMs > 0 ? (avgMs / 60000).toFixed(1) : '—';
    return { totalGenerated, thisMonth, avgGenerationMin };
  }

  resolvePdfPath(pdfUrl: string | null): string | null {
    if (!pdfUrl) return null;
    return path.join(process.cwd(), 'uploads', pdfUrl);
  }
}
