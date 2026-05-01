import { Injectable, NotFoundException } from '@nestjs/common';
import { ChartService } from '../chart/chart.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';
import { QuestionsService } from '../questions/questions.service';
import { GeminiService } from '../gemini/gemini.service';
import { SarvamService } from '../sarvam/sarvam.service';
import { User } from '../users/user.entity';
import { AdminQuickChartDto } from './dto/admin-quick-chart.dto';
import { AdminOracleAudioDto } from './dto/admin-oracle-audio.dto';
import { chartPayloadFromProfileFields } from './ist-chart-payload.util';
import { ORACLE_TTS_SYSTEM } from './oracle-tts.system';

@Injectable()
export class AdminService {
  constructor(
    private readonly chartService: ChartService,
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
    private readonly questionsService: QuestionsService,
    private readonly geminiService: GeminiService,
    private readonly sarvamService: SarvamService,
  ) {}

  async quickChart(admin: { id: string }, dto: AdminQuickChartDto) {
    const body = {
      date_of_birth: dto.date_of_birth,
      time_of_birth: dto.time_of_birth,
      latitude: dto.latitude,
      longitude: dto.longitude,
      timezone: dto.timezone ?? 5.5,
    };
    const chart = await this.chartService.createChart(body as any);
    let profile: unknown = null;
    if (dto.permanent) {
      profile = await this.profilesService.createAdminQuickProfile(admin.id, {
        name: dto.name,
        gender: dto.gender ?? undefined,
        dateOfBirth: dto.storageDateOfBirth ?? dto.date_of_birth,
        timeOfBirth: dto.storageTimeOfBirth ?? dto.time_of_birth,
        placeOfBirth: dto.placeOfBirth ?? undefined,
        latitude: dto.latitude,
        longitude: dto.longitude,
        timezone: dto.timezone ?? 5.5,
      });
    }
    return { chart, profile };
  }

  async listUsersForAdmin(): Promise<
    Array<{
      id: string;
      email: string;
      name: string | null;
      status: string;
      picture: string | null;
      questionsUsed: number;
      questionsLimit: number;
      customQuota: number | null;
      current_quota: number;
      quota_source: 'custom' | 'default';
      createdAt: Date;
      updatedAt: Date;
      lastQuestionAt: Date | null;
    }>
  > {
    const [users, latestByHash] = await Promise.all([
      this.usersService.getAllUsers(),
      this.questionsService.getLatestQuestionAtByUserHash(),
    ]);
    const rows = users.map((u) => {
      const base = this.toAdminUserRow(u);
      const h = this.questionsService.hashUser(u.id);
      const lastQuestionAt = latestByHash.get(h) ?? null;
      return { ...base, lastQuestionAt };
    });
    rows.sort((a, b) => {
      const ta = a.lastQuestionAt?.getTime();
      const tb = b.lastQuestionAt?.getTime();
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return tb - ta;
    });
    return rows;
  }

  private toAdminUserRow(u: User) {
    const cap = this.usersService.getEffectiveQuota(u);
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      picture: u.picture,
      questionsUsed: u.questionsUsed,
      questionsLimit: u.questionsLimit,
      customQuota: u.customQuota,
      current_quota: cap,
      quota_source: u.customQuota != null ? ('custom' as const) : ('default' as const),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  async setUserQuota(userId: string, quota: number) {
    const updated = await this.usersService.setCustomQuota(userId, quota);
    if (!updated) throw new NotFoundException('User not found');
    return this.toAdminUserRow(updated);
  }

  async oracleAudio(dto: AdminOracleAudioDto) {
    const profile = await this.profilesService.findById(dto.profileId);
    if (!profile) throw new NotFoundException('Profile not found');
    const lat = profile.latitude != null ? Number(profile.latitude) : Number.NaN;
    const lon = profile.longitude != null ? Number(profile.longitude) : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new NotFoundException('Profile missing coordinates');
    }
    const payload = chartPayloadFromProfileFields({
      dateOfBirth: profile.dateOfBirth,
      timeOfBirth: profile.timeOfBirth,
      latitude: lat,
      longitude: lon,
      timezone: profile.timezone != null ? Number(profile.timezone) : 5.5,
    });
    const chartJson = await this.chartService.createChart(payload as any);
    const chartStr = JSON.stringify(chartJson).slice(0, 18_000);
    const prompt = `${ORACLE_TTS_SYSTEM}

CHART_JSON:
${chartStr}

USER_QUESTION:
${dto.question}

Target TTS language code: ${dto.language}. Write the answer mainly in that locale's conversational style (still allow light Hinglish if natural).`;

    const gen = await this.geminiService.generateContent(
      {
        prompt,
        responseFormat: 'text',
        maxOutputTokens: 640,
        skipQuestionLog: true,
      },
      undefined,
    );
    const text = String(gen.text || '').trim();
    const audioBase64 = await this.sarvamService.textToSpeech(text, dto.language);
    return { text, audioBase64, language: dto.language };
  }
}
