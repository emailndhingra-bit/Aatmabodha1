import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThanOrEqual, Repository } from 'typeorm';
import { QuestionLog } from './question-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class QuestionsService {
  private hasNullified = false;

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

  private detectQuestionIntent(text: string): string {
    const q = text.toLowerCase();
    if (/\b(worst|terrible|broken|crisis|bikhar|toot|tabah)\b/.test(q)) return 'CRISIS';
    if (/\b(urgent|help|please|scared|afraid|dar|madad|bacha)\b/.test(q)) return 'ANXIETY';
    if (/\b(grow|expand|want|achieve|badhna|kamyabi|safal)\b/.test(q)) return 'AMBITION';
    if (/\b(confirm|right|correct|should|sahi|theek)\b/.test(q)) return 'VALIDATION';
    if (/\b(curious|wonder|interesting|jaanna|shauk)\b/.test(q)) return 'CURIOSITY';
    if (/\b(plan|when|how|strategy|kab|kaise|yojna)\b/.test(q)) return 'PLANNING';
    return 'GENERAL';
  }

  private detectEmotionalTone(text: string): string {
    const q = text.toLowerCase();
    if (/(just\s+curious|wondering|sirf\s+jaanna)/.test(q)) return 'CALM';
    if (/\b(please|desperate|nothing\s+works|scared|bahut\s+dar)\b/.test(q)) return 'URGENT';
    if (/\b(help|lost|dont\s+know|do\s+not\s+know|samajh\s+nahi)\b/.test(q) || /don\x27t\s+know/.test(q))
      return 'CONFUSED';
    if (/\b(excited|hope|want|ummeed|asha)\b/.test(q)) return 'HOPEFUL';
    if (/\b(failed|broken|worst|fail|toot\s+gaya)\b/.test(q)) return 'DESPERATE';
    return 'NEUTRAL';
  }

  // DPDPA 2023: questionText intentionally not stored.
  // Only anonymized behavioral + astrological context saved.
  async logQuestion(data: {
    userId: string;
    question: string;
    response: string;
    language?: string;
    cacheHit?: boolean;
    costUsd?: number;
    sessionId?: string;
  }): Promise<QuestionLog> {
    const inputTokens  = this.estimateTokens(data.question);
    const outputTokens = this.estimateTokens(data.response);
    const userHash = this.hashUser(data.userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayCount = await this.repo.count({
      where: {
        userHash,
        createdAt: MoreThanOrEqual(startOfToday),
      },
    });
    const sessionDepth = todayCount + 1;
    const sessionId =
      data.sessionId ?? `${Date.now()}-${userHash.slice(0, 8)}`;

    const log = this.repo.create({
      userHash,
      questionText: null, // DPDPA 2023 compliance
      questionCategory: this.categorizeQuestion(data.question || ''),
      responsePreview: data.response.substring(0, 200),
      inputTokens,
      outputTokens,
      costUsd: data.costUsd || 0,
      language: data.language || 'EN',
      cacheHit: data.cacheHit || false,
      questionIntent: this.detectQuestionIntent(data.question || ''),
      emotionalTone: this.detectEmotionalTone(data.question || ''),
      sessionId,
      sessionDepth,
    });
    return this.repo.save(log);
  }

  async nullifyQuestionText(): Promise<void> {
    const uncategorized = await this.repo.find({
      where: { questionCategory: IsNull() },
    });
    for (const q of uncategorized) {
      await this.repo.update(q.id, {
        questionCategory: this.categorizeQuestion(q.questionText || ''),
        questionText: null,
      });
    }

    await this.repo
      .createQueryBuilder()
      .update(QuestionLog)
      .set({ questionText: null })
      .where('questionText IS NOT NULL')
      .execute();
  }

  async getAdminQuestions(limit = 100): Promise<any[]> {
    if (!this.hasNullified) {
      await this.nullifyQuestionText();
      this.hasNullified = true;
    }
    const rows = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((q) => ({
      userHash: (q.userHash || '').substring(0, 10) + '...',
      category: q.questionCategory || 'GENERAL',
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
    const totalQuestions = await this.repo.count();

    const sumRow = await this.repo
      .createQueryBuilder('q')
      .select('COALESCE(SUM(q.costUsd), 0)', 'totalCost')
      .getRawOne<{ totalCost: string }>();
    const totalCost = parseFloat(String(sumRow?.totalCost ?? 0)) || 0;

    const cacheHits = await this.repo.count({ where: { cacheHit: true } });

    const logs = await this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
    const avgCostPerQuestion =
      totalQuestions > 0 ? totalCost / totalQuestions : 0;

    return {
      logs,
      totalCost,
      totalQuestions,
      cacheHits,
      avgCostPerQuestion,
    };
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
