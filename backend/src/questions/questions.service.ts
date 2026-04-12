import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionLog } from './question-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(QuestionLog)
    private repo: Repository<QuestionLog>,
  ) {}

  hashUser(userId: string): string {
    return crypto.createHash('sha256').update(userId + 'aatmabodha_salt').digest('hex').substring(0, 12);
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    const inputCost  = (inputTokens  / 1_000_000) * 2.00;
    const outputCost = (outputTokens / 1_000_000) * 12.00;
    return Math.round((inputCost + outputCost) * 100000) / 100000;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private categorizeQuestion(text: string): string {
    const q = text.toLowerCase();
    if (q.match(/shaadi|marriage|partner|love|vivah|spouse|wife|husband|pyaar|breakup|divorce|girlfriend|boyfriend|rishta/))
      return 'MARRIAGE';
    if (q.match(/career|job|business|naukri|promotion|salary|profession|startup|vyapar|interview|resign|mlc|politics|political/))
      return 'CAREER';
    if (q.match(/health|bimari|sehat|doctor|hospital|sick|illness|pain|surgery|disease|stress|anxiety/)) return 'HEALTH';
    if (q.match(/money|paisa|dhan|wealth|income|financial|loan|debt|savings|investment|stocks|profit/)) return 'WEALTH';
    if (q.match(/car|gadi|vehicle|property|ghar|home|house|plot|land|flat|apartment/)) return 'PROPERTY';
    if (q.match(/child|baccha|pregnancy|putra|santaan|son|daughter/)) return 'CHILDREN';
    if (q.match(/travel|videsh|foreign|abroad|visa|passport/)) return 'TRAVEL';
    if (q.match(/spiritual|soul|karma|past life|ishta|moksha|dharma|meditation|mantra/)) return 'SPIRITUAL';
    if (q.match(/personality|nature|character|psychology|unique|trait|who am i|tattoo/)) return 'PERSONALITY';
    if (q.match(/kab|when|timing|future|prediction|2025|2026|2027|turning point/)) return 'TIMING';
    return 'GENERAL';
  }

  async logQuestion(data: {
    userId: string;
    question: string;
    response: string;
    language?: string;
    cacheHit?: boolean;
    costUsd?: number;
  }): Promise<QuestionLog> {
    const inputTokens  = this.estimateTokens(data.question);
    const outputTokens = this.estimateTokens(data.response);

    const log = this.repo.create({
      userHash:        this.hashUser(data.userId),
      questionText:    data.question.substring(0, 500),
      responsePreview: data.response.substring(0, 200),
      inputTokens,
      outputTokens,
      costUsd:         data.costUsd || 0,
      language:        data.language || 'EN',
      cacheHit:        data.cacheHit || false,
    });
    const saved = await this.repo.save(log);
    await this.repo.update(saved.id, {
      questionCategory: this.categorizeQuestion(data.question || ''),
    });
    return saved;
  }

  async getAdminQuestions(limit = 50): Promise<any[]> {
    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((q) => ({
      userHash: (q.userHash || '').substring(0, 10) + '...',
      category: q.questionCategory || this.categorizeQuestion(q.questionText || ''),
      language: q.language,
      cacheHit: q.cacheHit,
      costInr: q.costUsd ? (q.costUsd * 92.47).toFixed(4) : '0.0000',
      time: q.createdAt,
    }));
  }

  async categorizeAllExisting(): Promise<void> {
    const all = await this.repo.find();
    for (const q of all) {
      if (!q.questionCategory) {
        await this.repo.update(q.id, {
          questionCategory: this.categorizeQuestion(q.questionText || ''),
        });
      }
    }
  }

  async getStats(): Promise<any> {
    const logs = await this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
    const totalCost    = logs.reduce((sum, l) => sum + l.costUsd, 0);
    const totalQ       = logs.length;
    const cacheHits    = logs.filter(l => l.cacheHit).length;
    const avgCost      = totalQ > 0 ? totalCost / totalQ : 0;
    return { logs, totalCost, totalQuestions: totalQ, cacheHits, avgCostPerQuestion: avgCost };
  }

  async getRecentQuestions(limit = 50): Promise<QuestionLog[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async getRecentByUser(
    userId: string,
    limit = 5,
  ): Promise<Pick<QuestionLog, 'questionText' | 'createdAt' | 'language'>[]> {
    const userHash = this.hashUser(userId);
    return this.repo.find({
      where: { userHash },
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['questionText', 'createdAt', 'language'],
    });
  }
}
