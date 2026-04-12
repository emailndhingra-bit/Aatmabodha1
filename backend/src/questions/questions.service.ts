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
    return this.repo.save(log);
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
