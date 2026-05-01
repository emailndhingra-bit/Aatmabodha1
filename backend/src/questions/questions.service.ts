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
    const t = text.toLowerCase();

    // REMEDY — solution seeking
    if (
      t.includes('remedy') || t.includes('upay') ||
      t.includes('kya karoon') || t.includes('solution') ||
      t.includes('kaise theek') || t.includes('mantra') ||
      t.includes('rudraksha') || t.includes('totka') ||
      t.includes('kya pehnu') || t.includes('stone') ||
      t.includes('gemstone') || t.includes('ratna')
    ) return 'REMEDY';

    // CAREER
    if (
      t.includes('career') || t.includes('job') ||
      t.includes('naukri') || t.includes('kaam') ||
      t.includes('business') || t.includes('promotion') ||
      t.includes('salary') || t.includes('office') ||
      t.includes('interview') || t.includes('profession')
    ) return 'CAREER';

    // MARRIAGE
    if (
      t.includes('shaadi') || t.includes('marriage') ||
      t.includes('rishta') || t.includes('partner') ||
      t.includes('spouse') || t.includes('husband') ||
      t.includes('wife') || t.includes('biwi') ||
      t.includes('pati') || t.includes('dulha') ||
      t.includes('dulhan') || t.includes('love') ||
      t.includes('relationship')
    ) return 'MARRIAGE';

    // WEALTH
    if (
      t.includes('paisa') || t.includes('money') ||
      t.includes('wealth') || t.includes('income') ||
      t.includes('financial') || t.includes('loan') ||
      t.includes('debt') || t.includes('investment') ||
      t.includes('savings') || t.includes('property value')
    ) return 'WEALTH';

    // TIMING
    if (
      t.includes('kab') || t.includes('when') ||
      t.includes('kitne saal') || t.includes('which year') ||
      t.includes('konsa month') || t.includes('timeline') ||
      t.includes('window') || t.includes('period')
    ) return 'TIMING';

    // PROPERTY
    if (
      t.includes('ghar') || t.includes('property') ||
      t.includes('house') || t.includes('flat') ||
      t.includes('plot') || t.includes('zameen') ||
      t.includes('makaan') || t.includes('real estate')
    ) return 'PROPERTY';

    // HEALTH
    if (
      t.includes('health') || t.includes('sehat') ||
      t.includes('bimari') || t.includes('illness') ||
      t.includes('disease') || t.includes('doctor') ||
      t.includes('hospital') || t.includes('pain') ||
      t.includes('surgery') || t.includes('medicine')
    ) return 'HEALTH';

    // CHILDREN
    if (
      t.includes('child') || t.includes('baby') ||
      t.includes('bachcha') || t.includes('pregnancy') ||
      t.includes('pregnant') || t.includes('son') ||
      t.includes('daughter') || t.includes('beta') ||
      t.includes('beti') || t.includes('santaan')
    ) return 'CHILDREN';

    // PERSONALITY
    if (
      t.includes('personality') || t.includes('nature') ||
      t.includes('character') || t.includes('kaisa hoon') ||
      t.includes('mera nature') || t.includes('strength') ||
      t.includes('weakness') || t.includes('who am i') ||
      t.includes('main kaun') || t.includes('aatma')
    ) return 'PERSONALITY';

    // SPIRITUAL
    if (
      t.includes('spiritual') || t.includes('karma') ||
      t.includes('past life') || t.includes('moksha') ||
      t.includes('dharma') || t.includes('ishta devata') ||
      t.includes('god') || t.includes('bhagwan') ||
      t.includes('puja') || t.includes('mandir jaana')
    ) return 'SPIRITUAL';

    // TRAVEL
    if (
      t.includes('travel') || t.includes('videsh') ||
      t.includes('foreign') || t.includes('abroad') ||
      t.includes('visa') || t.includes('immigration') ||
      t.includes('settle') || t.includes('relocate')
    ) return 'TRAVEL';

    // DISTRESS — emotional crisis
    if (
      t.includes('sab kharab') || t.includes('kuch nahi') ||
      t.includes('thak gaya') || t.includes('akela') ||
      t.includes('koi nahi') || t.includes('life mein') ||
      t.includes('depressed') || t.includes('sad') ||
      t.includes('dukhi') || t.includes('rona')
    ) return 'DISTRESS';

    // GUIDANCE — general life direction
    if (
      t.includes('kya karna chahiye') || t.includes('aaj') ||
      t.includes('life') || t.includes('future') ||
      t.includes('aage') || t.includes('direction') ||
      t.includes('raasta') || t.includes('manzil')
    ) return 'GUIDANCE';

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
    const t = text.toLowerCase();

    // DESPERATE — highest distress
    if (
      t.includes('mar jaana') || t.includes('khatam') ||
      t.includes('koi raasta nahi') || t.includes('toot gaya') ||
      t.includes('haar gaya') || t.includes('aur nahi') ||
      t.includes('bahut zyada takleef') || t.includes('end kar') ||
      t.includes('jeena nahi') || t.includes('give up')
    ) return 'DESPERATE';

    // URGENT — time pressure
    if (
      t.includes('aaj') || t.includes('abhi') ||
      t.includes('turant') || t.includes('jaldi') ||
      t.includes('kal interview') || t.includes('kal tak') ||
      t.includes('tonight') || t.includes('emergency') ||
      t.includes('last chance') || t.includes('deadline') ||
      t.includes('closing') || t.includes('kal ka')
    ) return 'URGENT';

    // ANXIOUS — worry/fear
    if (
      t.includes('dar') || t.includes('tension') ||
      t.includes('worried') || t.includes('nervous') ||
      t.includes('hoga ya nahi') || t.includes('pata nahi') ||
      t.includes('kya hoga') || t.includes('sahi hoga') ||
      t.includes('galat') || t.includes('risk') ||
      t.includes('safe hai') || t.includes('thik hoga')
    ) return 'ANXIOUS';

    // CONFUSED — seeking clarity
    if (
      t.includes('samajh nahi') || t.includes('confused') ||
      t.includes('kya karoon') || t.includes('decide nahi') ||
      t.includes('pata nahi kya') || t.includes('dono') ||
      t.includes('choose') || t.includes('option') ||
      t.includes('ya phir') || t.includes('better kya')
    ) return 'CONFUSED';

    // HOPEFUL — positive seeking
    if (
      t.includes('hoga na') || t.includes('milega') ||
      t.includes('chance hai') || t.includes('positive') ||
      t.includes('accha hoga') || t.includes('ho jayega') ||
      t.includes('sab theek') || t.includes('umeed') ||
      t.includes('hope') || t.includes('optimistic')
    ) return 'HOPEFUL';

    // PLANNING — decision making
    if (
      t.includes('plan') || t.includes('sochna') ||
      t.includes('best time') || t.includes('sahi waqt') ||
      t.includes('kab karoon') || t.includes('kab shuru') ||
      t.includes('kab loon') || t.includes('decide') ||
      t.includes('investment') || t.includes('shuruaat')
    ) return 'PLANNING';

    // SEEKING — wants guidance
    if (
      t.includes('batao') || t.includes('samjhao') ||
      t.includes('guide') || t.includes('help') ||
      t.includes('kya karna chahiye') || t.includes('suggestion') ||
      t.includes('advice') || t.includes('recommend')
    ) return 'SEEKING';

    // CALM — analytical/curious
    if (
      t.includes('kyun') || t.includes('kaise') ||
      t.includes('explain') || t.includes('detail') ||
      t.includes('interesting') || t.includes('curious') ||
      t.includes('jaanna chahta') || t.includes('samajhna')
    ) return 'CALM';

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
    chartContext?: {
      userMoonSign?: string;
      userLagna?: string;
      userAtmakaraka?: string;
      userSadeSati?: boolean;
      userDashaType?: string;
      ageGroup?: string;
      dashaAtTime?: string;
    };
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

    // Calculate returnedAfterDays
    const lastQuery = await this.repo.findOne({
      where: { userHash },
      order: { createdAt: 'DESC' },
    });
    const returnedAfterDays = lastQuery
      ? Math.floor(
          (Date.now() - new Date(lastQuery.createdAt).getTime())
          / (1000 * 60 * 60 * 24)
        )
      : 0;

    // Get previous category
    const prevCategory = lastQuery?.questionCategory || null;

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
      returnedAfterDays,
      prevCategory,
      // Chart context (passed from frontend)
      userMoonSign: data.chartContext?.userMoonSign || null,
      userLagna: data.chartContext?.userLagna || null,
      userAtmakaraka: data.chartContext?.userAtmakaraka || null,
      userSadeSati: data.chartContext?.userSadeSati ?? null,
      userDashaType: data.chartContext?.userDashaType || null,
      ageGroup: data.chartContext?.ageGroup || null,
      dashaAtTime: data.chartContext?.dashaAtTime || null,
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

    const avgCostPerQuestion =
      totalQuestions > 0 ? totalCost / totalQuestions : 0;

    // Increase to 2000 rows for accurate distributions
    const logs = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: 2000,
    });

    // ─── TODAY / WEEK / MONTH cost metrics ───
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRow, weekRow, monthRow] = await Promise.all([
      this.repo
        .createQueryBuilder('q')
        .select('COALESCE(SUM(q.costUsd),0)', 'cost')
        .addSelect('COUNT(*)', 'cnt')
        .where('q.createdAt >= :d', { d: startOfToday })
        .getRawOne<{ cost: string; cnt: string }>(),
      this.repo
        .createQueryBuilder('q')
        .select('COALESCE(SUM(q.costUsd),0)', 'cost')
        .addSelect('COUNT(*)', 'cnt')
        .where('q.createdAt >= :d', { d: startOfWeek })
        .getRawOne<{ cost: string; cnt: string }>(),
      this.repo
        .createQueryBuilder('q')
        .select('COALESCE(SUM(q.costUsd),0)', 'cost')
        .addSelect('COUNT(*)', 'cnt')
        .where('q.createdAt >= :d', { d: startOfMonth })
        .getRawOne<{ cost: string; cnt: string }>(),
    ]);

    const todayCostUsd = parseFloat(String(todayRow?.cost ?? 0)) || 0;
    const todayQueries = parseInt(String(todayRow?.cnt ?? 0), 10) || 0;
    const weekCostUsd = parseFloat(String(weekRow?.cost ?? 0)) || 0;
    const monthCostUsd = parseFloat(String(monthRow?.cost ?? 0)) || 0;

    // ─── Astrological distributions ───
    const moonSignRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.userMoonSign', 'sign')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.userMoonSign IS NOT NULL')
      .andWhere("q.userMoonSign != ''")
      .groupBy('q.userMoonSign')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ sign: string; cnt: string }>();

    const lagnaRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.userLagna', 'sign')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.userLagna IS NOT NULL')
      .andWhere("q.userLagna != ''")
      .groupBy('q.userLagna')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ sign: string; cnt: string }>();

    const akRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.userAtmakaraka', 'planet')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.userAtmakaraka IS NOT NULL')
      .andWhere("q.userAtmakaraka != ''")
      .groupBy('q.userAtmakaraka')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ planet: string; cnt: string }>();

    const dashaRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.userDashaType', 'dasha')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.userDashaType IS NOT NULL')
      .andWhere("q.userDashaType != ''")
      .groupBy('q.userDashaType')
      .orderBy('cnt', 'DESC')
      .getRawMany<{ dasha: string; cnt: string }>();

    const sadeSatiCount = await this.repo.count({
      where: { userSadeSati: true },
    });

    // ─── Dasha × Category matrix ───
    const dashaCatRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.userDashaType', 'dasha')
      .addSelect('q.questionCategory', 'cat')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.userDashaType IS NOT NULL')
      .andWhere('q.questionCategory IS NOT NULL')
      .groupBy('q.userDashaType')
      .addGroupBy('q.questionCategory')
      .getRawMany<{ dasha: string; cat: string; cnt: string }>();

    // ─── Emotion × AgeGroup matrix ───
    const emotionAgeRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.emotionalTone', 'tone')
      .addSelect('q.ageGroup', 'age')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.emotionalTone IS NOT NULL')
      .andWhere('q.ageGroup IS NOT NULL')
      .groupBy('q.emotionalTone')
      .addGroupBy('q.ageGroup')
      .getRawMany<{ tone: string; age: string; cnt: string }>();

    // ─── Peak hours with distress ───
    const peakHoursRaw = await this.repo
      .createQueryBuilder('q')
      .select('EXTRACT(HOUR FROM q."createdAt")::int', 'hour')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        "COUNT(*) FILTER (WHERE q.emotionalTone IN ('ANXIOUS','DESPERATE','URGENT'))",
        'distressed',
      )
      .groupBy('EXTRACT(HOUR FROM q."createdAt")')
      .orderBy('EXTRACT(HOUR FROM q."createdAt")', 'ASC')
      .getRawMany<{ hour: string; total: string; distressed: string }>();

    // ─── Return rate ───
    const returnedRaw = await this.repo
      .createQueryBuilder('q')
      .select('q.returnedAfterDays', 'days')
      .addSelect('COUNT(*)', 'cnt')
      .where('q.returnedAfterDays IS NOT NULL')
      .groupBy('q.returnedAfterDays')
      .orderBy('q.returnedAfterDays', 'ASC')
      .getRawMany<{ days: number; cnt: string }>();

    return {
      logs,
      totalCost,
      totalQuestions,
      cacheHits,
      avgCostPerQuestion,
      // New aggregates
      todayCostUsd,
      todayQueries,
      weekCostUsd,
      monthCostUsd,
      moonSignDist: moonSignRaw.map((r) => ({
        sign: r.sign,
        cnt: parseInt(String(r.cnt), 10),
      })),
      lagnaDist: lagnaRaw.map((r) => ({
        sign: r.sign,
        cnt: parseInt(String(r.cnt), 10),
      })),
      akDist: akRaw.map((r) => ({
        planet: r.planet,
        cnt: parseInt(String(r.cnt), 10),
      })),
      dashaDist: dashaRaw.map((r) => ({
        dasha: r.dasha,
        cnt: parseInt(String(r.cnt), 10),
      })),
      sadeSatiCount,
      dashaCatMatrix: dashaCatRaw.map((r) => ({
        dasha: r.dasha,
        cat: r.cat,
        cnt: parseInt(String(r.cnt), 10),
      })),
      emotionAgeDist: emotionAgeRaw.map((r) => ({
        tone: r.tone,
        age: r.age,
        cnt: parseInt(String(r.cnt), 10),
      })),
      peakHours: peakHoursRaw.map((r) => ({
        hour: Number(r.hour),
        total: parseInt(String(r.total), 10),
        distressed: parseInt(String(r.distressed), 10),
      })),
      returnedDist: returnedRaw.map((r) => ({
        days: Number(r.days),
        cnt: parseInt(String(r.cnt), 10),
      })),
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

  /** MAX(createdAt) per userHash — same hash as {@link hashUser}. */
  async getLatestQuestionAtByUserHash(): Promise<Map<string, Date>> {
    const rows = await this.repo
      .createQueryBuilder('q')
      .select('q.userHash', 'userHash')
      .addSelect('MAX(q.createdAt)', 'lastAt')
      .groupBy('q.userHash')
      .getRawMany();
    const m = new Map<string, Date>();
    for (const row of rows as Record<string, unknown>[]) {
      const hash = String(row.userHash ?? row.userhash ?? '').trim();
      if (!hash) continue;
      const raw = row.lastAt ?? row.lastat;
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (!Number.isNaN(d.getTime())) m.set(hash, d);
    }
    return m;
  }
}
