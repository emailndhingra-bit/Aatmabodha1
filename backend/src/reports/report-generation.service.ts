import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ChartService } from '../chart/chart.service';
import { GeminiService } from '../gemini/gemini.service';
import { ProfilesService } from '../profiles/profiles.service';
import { Profile } from '../profiles/profile.entity';
import { chartPayloadFromProfileFields } from './chart-payload.util';
import { buildReportSectionPrompt } from './report-prompt';
import { PdfUtilsService } from './pdf-utils.service';
import { GeneratedReport } from './generated-report.entity';
import { GeneratedReportsService } from './generated-reports.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export type GenerateReportInput = {
  reportType: string;
  profileIdA: string;
  profileIdB?: string;
  tier?: string;
  language: string;
  flags?: Record<string, unknown>;
};

const DUAL_PROFILE_TYPES = new Set(['kundli_match_plus', 'vibe_check']);

type SectionPlan = { key: string; title: string; instruction: string; min: number; max: number };

const SECTION_PLANS: Record<string, SectionPlan[]> = {
  career_clarity: [
    {
      key: 'planetary',
      title: 'Planetary Profile',
      instruction:
        'Describe lagna lord, Sun and Moon strength and how they shape professional temperament. Reference houses 1,6,10 from chart data only.',
      min: 160,
      max: 220,
    },
    {
      key: 'career',
      title: 'Career Direction',
      instruction:
        'Analyse 10th house, its lord placement, and current dasha window for career momentum. Name specific months/years when possible from dasha data.',
      min: 180,
      max: 240,
    },
    {
      key: 'timing',
      title: 'Growth & Timing',
      instruction:
        'Give two actionable focus areas for the next 18 months with chart-backed timing. Close with encouragement.',
      min: 160,
      max: 200,
    },
  ],
  business_founder: [
    {
      key: 'risk',
      title: 'Risk & Opportunity Map',
      instruction:
        'Weave 2nd, 7th, 8th and 11th house themes for partnership and liquidity using chart facts only.',
      min: 170,
      max: 230,
    },
    {
      key: 'execution',
      title: 'Execution Arc',
      instruction:
        'Discuss Mars, Saturn and Mercury interplay for execution discipline. Mention if family business flag applies only when plausible from chart.',
      min: 170,
      max: 230,
    },
    {
      key: 'scale',
      title: 'Scale Windows',
      instruction:
        'Identify favourable 12–24 month windows using dasha and house lords. Be concrete with quarters/years.',
      min: 160,
      max: 210,
    },
  ],
  kundli_match_plus: [
    {
      key: 'synastry',
      title: 'Emotional Synergy',
      instruction:
        'Compare Moon and Venus placements across both charts; describe harmony and friction with tact.',
      min: 180,
      max: 240,
    },
    {
      key: 'koota',
      title: 'Koota-style Harmony',
      instruction:
        'Reference nakshatra compatibility themes without inventing numeric koota scores unless derivable; stay chart-grounded.',
      min: 170,
      max: 230,
    },
    {
      key: 'future',
      title: 'Shared Timeline',
      instruction:
        'Outline joint favourable periods in next 24 months using both charts dasha context.',
      min: 160,
      max: 210,
    },
  ],
  vibe_check: [
    {
      key: 'first',
      title: 'First Impression Chemistry',
      instruction: 'Short synastry of rising signs and Moon; playful but professional.',
      min: 120,
      max: 160,
    },
    {
      key: 'second',
      title: 'Values & Pace',
      instruction: 'Compare Mercury, Jupiter and house 5/7 emphasis for lifestyle fit.',
      min: 120,
      max: 160,
    },
    {
      key: 'third',
      title: 'Green / Amber Flags',
      instruction: 'Three concise observations grounded in aspects/house lords; end warmly.',
      min: 120,
      max: 160,
    },
  ],
  child_destiny: [
    {
      key: 'temperament',
      title: 'Temperament Blueprint',
      instruction: 'Moon, lagna and 5th house for learning style and sensitivity — supportive tone.',
      min: 170,
      max: 230,
    },
    {
      key: 'talents',
      title: 'Talents & Interests',
      instruction: 'Mercury, Jupiter, 3rd and 9th house facts; avoid deterministic language.',
      min: 160,
      max: 220,
    },
    {
      key: 'guidance',
      title: 'Parental Guidance',
      instruction: 'Saturn and 4th house for structure and security; practical suggestions.',
      min: 150,
      max: 200,
    },
  ],
};

@Injectable()
export class ReportGenerationService {
  private readonly logger = new Logger(ReportGenerationService.name);

  constructor(
    private readonly profiles: ProfilesService,
    private readonly charts: ChartService,
    private readonly gemini: GeminiService,
    private readonly pdf: PdfUtilsService,
    private readonly generated: GeneratedReportsService,
  ) {}

  private slug(s: string): string {
    return (s || 'chart')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 36);
  }

  private dashaSnippet(chart: unknown): string {
    try {
      const c = chart as Record<string, unknown>;
      const vd = (c?.VD ?? c?.vimshottari) as unknown;
      return JSON.stringify(Array.isArray(vd) ? (vd as unknown[]).slice(0, 12) : vd).slice(0, 4000);
    } catch {
      return '{}';
    }
  }

  private chartBlob(chart: unknown): string {
    return JSON.stringify(chart ?? {}).slice(0, 20000);
  }

  private async loadProfile(id: string): Promise<Profile> {
    const p = await this.profiles.findById(id);
    if (!p) throw new BadRequestException('Profile not found');
    const lat = p.latitude != null ? Number(p.latitude) : Number.NaN;
    const lon = p.longitude != null ? Number(p.longitude) : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Profile missing coordinates');
    }
    return p;
  }

  private async fetchChartForProfile(p: Profile): Promise<unknown> {
    const tz = p.timezone != null && String(p.timezone) !== '' ? parseFloat(String(p.timezone)) : 5.5;
    const payload = chartPayloadFromProfileFields({
      dateOfBirth: p.dateOfBirth,
      timeOfBirth: p.timeOfBirth,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      timezone: tz,
    });
    return this.charts.createChart(payload as any);
  }

  async generate(input: GenerateReportInput, adminEmail: string): Promise<GeneratedReport> {
    const plan = SECTION_PLANS[input.reportType];
    if (!plan) throw new BadRequestException('Unknown report type');

    if (DUAL_PROFILE_TYPES.has(input.reportType)) {
      if (!input.profileIdB) throw new BadRequestException('This report requires two profiles');
    } else if (input.profileIdB) {
      throw new BadRequestException('This report uses a single profile only');
    }

    const started = Date.now();
    const pa = await this.loadProfile(input.profileIdA);
    const chartA = await this.fetchChartForProfile(pa);
    let chartB: unknown | null = null;
    let pb: Profile | null = null;
    if (input.profileIdB) {
      pb = await this.loadProfile(input.profileIdB);
      chartB = await this.fetchChartForProfile(pb);
    }

    const personLabel = pb ? `${pa.name} & ${pb.name}` : pa.name;
    const chartJson =
      chartB != null
        ? JSON.stringify({ primary: chartA, partner: chartB }).slice(0, 22000)
        : this.chartBlob(chartA);
    const dashaData = this.dashaSnippet(chartA);
    const transitData =
      'Transit overlay not computed in Reports Hub v1 — rely on natal dasha windows and house lords only.';

    const htmlParts: string[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const titles: Record<string, string> = {
      career_clarity: 'Career Clarity Report',
      business_founder: 'Business Founder Report',
      kundli_match_plus: 'Kundli Match Plus',
      vibe_check: 'Vibe Check',
      child_destiny: 'Child Destiny Report',
    };
    const displayTitle = titles[input.reportType] ?? input.reportType;
    htmlParts.push(this.pdf.generateCoverPage(displayTitle, personLabel, today));

    let sectionIndex = 0;
    for (const sec of plan) {
      sectionIndex += 1;
      htmlParts.push(this.pdf.generateSectionDivider(sectionIndex, sec.title));
      const prompt = buildReportSectionPrompt({
        language: input.language,
        minWords: sec.min,
        maxWords: sec.max,
        chartJson,
        dashaData,
        transitData,
        sectionInstructions: sec.instruction,
      });
      const gen = await this.gemini.generateContent(
        {
          prompt,
          responseFormat: 'text',
          maxOutputTokens: 900,
          skipQuestionLog: true,
        },
        undefined,
      );
      const text = String(gen.text || '').trim();
      htmlParts.push(this.pdf.wrapProseSection(this.pdf.escapeHtml(text)));
    }

    const html = this.pdf.compileFinalPDF(htmlParts);
    let pdfBuffer: Buffer;
    try {
      if (process.env.NODE_ENV === 'production') {
        const chromium = await import('@sparticuz/chromium');
        const executablePath = await chromium.default.executablePath();
        const puppeteerModule = await import('puppeteer-core');
        const browser = await puppeteerModule.default.launch({
          args: chromium.default.args,
          defaultViewport: chromium.default.defaultViewport,
          executablePath,
          headless: true,
        });
        try {
          const page = await browser.newPage();
          await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 120_000,
          });
          const buf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '12mm',
              bottom: '14mm',
              left: '12mm',
              right: '12mm',
            },
          });
          pdfBuffer = Buffer.from(buf);
        } finally {
          await browser.close();
        }
      } else {
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        try {
          const page = await browser.newPage();
          await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 120_000,
          });
          const buf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '12mm',
              bottom: '14mm',
              left: '12mm',
              right: '12mm',
            },
          });
          pdfBuffer = Buffer.from(buf);
        } finally {
          await browser.close();
        }
      }
    } catch (e) {
      this.logger.error('Puppeteer PDF failed', e as Error);
      throw new BadRequestException(
        'PDF generation failed. Error: ' + (e as Error).message,
      );
    }

    const dir = path.join(process.cwd(), 'uploads', 'reports');
    await fs.mkdir(dir, { recursive: true });
    const fname = `${input.reportType}-${this.slug(personLabel)}-${Date.now()}.pdf`;
    const rel = `reports/${fname}`;
    await fs.writeFile(path.join(process.cwd(), 'uploads', rel), pdfBuffer);

    const duration = Date.now() - started;
    const pageCount = plan.length + 1;

    return this.generated.create({
      reportType: input.reportType,
      profileIdA: pa.id,
      profileIdB: pb?.id ?? null,
      tier: input.tier ?? null,
      language: input.language,
      pdfUrl: rel,
      pageCount,
      generatedBy: adminEmail,
      generationDurationMs: duration,
      meta: {
        personA: pa.name,
        personB: pb?.name ?? null,
        reportTitle: displayTitle,
        tier: input.tier ?? null,
        flags: input.flags ?? {},
      },
    });
  }
}
