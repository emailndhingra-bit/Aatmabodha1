import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Report } from './report.entity';
import { GeminiService } from '../gemini/gemini.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    private readonly gemini: GeminiService,
  ) {}

  async logReport(
    userId: string,
    profileName: string,
    reportType: string,
    title: string,
    content: string,
    language: string,
  ): Promise<Report> {
    const contentPreview = (content ?? '').substring(0, 500);
    const row = this.repo.create({
      userId,
      profileName,
      reportType,
      title,
      contentPreview,
      language,
    });
    return this.repo.save(row);
  }

  async getAdminReports(
    page = 1,
    limit = 20,
    reportType?: string,
  ): Promise<{ items: Report[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const where = reportType ? { reportType } : {};
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return { items, total, page: safePage, limit: safeLimit };
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getReportStats(): Promise<{
    countByType: { reportType: string; count: string }[];
    countToday: number;
    countThisWeek: number;
  }> {
    const countByType = await this.repo
      .createQueryBuilder('r')
      .select('r.reportType', 'reportType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.reportType')
      .getRawMany();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const countToday = await this.repo.count({
      where: { createdAt: Between(startOfToday, endOfToday) },
    });

    const startOfWeek = this.getStartOfWeekMonday();
    const countThisWeek = await this.repo.count({
      where: { createdAt: Between(startOfWeek, new Date()) },
    });

    return { countByType, countToday, countThisWeek };
  }

  private getStartOfWeekMonday(): Date {
    const now = new Date();
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** Admin Child Destiny — multi-part Gemini generation */
  async generateChildDestiny(promptParts: string[]): Promise<{ report: string }> {
    const chunks: string[] = [];
    for (const prompt of promptParts) {
      const gen = await this.gemini.generateContent(
        {
          prompt,
          responseFormat: 'text',
          maxOutputTokens: 8192,
          skipQuestionLog: true,
          skipOutputTruncate: true,
          skipInflightDedup: true,
        },
        undefined,
      );
      chunks.push(String(gen.text || '').trim());
    }
    return { report: chunks.join('\n\n---\n\n') };
  }
}
