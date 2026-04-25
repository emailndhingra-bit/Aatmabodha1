"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportGenerationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerationService = void 0;
const common_1 = require("@nestjs/common");
const chart_service_1 = require("../chart/chart.service");
const gemini_service_1 = require("../gemini/gemini.service");
const profiles_service_1 = require("../profiles/profiles.service");
const chart_payload_util_1 = require("./chart-payload.util");
const report_prompt_1 = require("./report-prompt");
const pdf_utils_service_1 = require("./pdf-utils.service");
const generated_reports_service_1 = require("./generated-reports.service");
const fs = require("fs/promises");
const path = require("path");
const DUAL_PROFILE_TYPES = new Set(['kundli_match_plus', 'vibe_check']);
const SECTION_PLANS = {
    career_clarity: [
        {
            key: 'planetary',
            title: 'Planetary Profile',
            instruction: 'Describe lagna lord, Sun and Moon strength and how they shape professional temperament. Reference houses 1,6,10 from chart data only.',
            min: 160,
            max: 220,
        },
        {
            key: 'career',
            title: 'Career Direction',
            instruction: 'Analyse 10th house, its lord placement, and current dasha window for career momentum. Name specific months/years when possible from dasha data.',
            min: 180,
            max: 240,
        },
        {
            key: 'timing',
            title: 'Growth & Timing',
            instruction: 'Give two actionable focus areas for the next 18 months with chart-backed timing. Close with encouragement.',
            min: 160,
            max: 200,
        },
    ],
    business_founder: [
        {
            key: 'risk',
            title: 'Risk & Opportunity Map',
            instruction: 'Weave 2nd, 7th, 8th and 11th house themes for partnership and liquidity using chart facts only.',
            min: 170,
            max: 230,
        },
        {
            key: 'execution',
            title: 'Execution Arc',
            instruction: 'Discuss Mars, Saturn and Mercury interplay for execution discipline. Mention if family business flag applies only when plausible from chart.',
            min: 170,
            max: 230,
        },
        {
            key: 'scale',
            title: 'Scale Windows',
            instruction: 'Identify favourable 12–24 month windows using dasha and house lords. Be concrete with quarters/years.',
            min: 160,
            max: 210,
        },
    ],
    kundli_match_plus: [
        {
            key: 'synastry',
            title: 'Emotional Synergy',
            instruction: 'Compare Moon and Venus placements across both charts; describe harmony and friction with tact.',
            min: 180,
            max: 240,
        },
        {
            key: 'koota',
            title: 'Koota-style Harmony',
            instruction: 'Reference nakshatra compatibility themes without inventing numeric koota scores unless derivable; stay chart-grounded.',
            min: 170,
            max: 230,
        },
        {
            key: 'future',
            title: 'Shared Timeline',
            instruction: 'Outline joint favourable periods in next 24 months using both charts dasha context.',
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
let ReportGenerationService = ReportGenerationService_1 = class ReportGenerationService {
    constructor(profiles, charts, gemini, pdf, generated) {
        this.profiles = profiles;
        this.charts = charts;
        this.gemini = gemini;
        this.pdf = pdf;
        this.generated = generated;
        this.logger = new common_1.Logger(ReportGenerationService_1.name);
    }
    slug(s) {
        return (s || 'chart')
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 36);
    }
    dashaSnippet(chart) {
        try {
            const c = chart;
            const vd = (c?.VD ?? c?.vimshottari);
            return JSON.stringify(Array.isArray(vd) ? vd.slice(0, 12) : vd).slice(0, 4000);
        }
        catch {
            return '{}';
        }
    }
    chartBlob(chart) {
        return JSON.stringify(chart ?? {}).slice(0, 20000);
    }
    async loadProfile(id) {
        const p = await this.profiles.findById(id);
        if (!p)
            throw new common_1.BadRequestException('Profile not found');
        const lat = p.latitude != null ? Number(p.latitude) : Number.NaN;
        const lon = p.longitude != null ? Number(p.longitude) : Number.NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw new common_1.BadRequestException('Profile missing coordinates');
        }
        return p;
    }
    async fetchChartForProfile(p) {
        const tz = p.timezone != null && String(p.timezone) !== '' ? parseFloat(String(p.timezone)) : 5.5;
        const payload = (0, chart_payload_util_1.chartPayloadFromProfileFields)({
            dateOfBirth: p.dateOfBirth,
            timeOfBirth: p.timeOfBirth,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
            timezone: tz,
        });
        return this.charts.createChart(payload);
    }
    async generate(input, adminEmail) {
        const plan = SECTION_PLANS[input.reportType];
        if (!plan)
            throw new common_1.BadRequestException('Unknown report type');
        if (DUAL_PROFILE_TYPES.has(input.reportType)) {
            if (!input.profileIdB)
                throw new common_1.BadRequestException('This report requires two profiles');
        }
        else if (input.profileIdB) {
            throw new common_1.BadRequestException('This report uses a single profile only');
        }
        const started = Date.now();
        const pa = await this.loadProfile(input.profileIdA);
        const chartA = await this.fetchChartForProfile(pa);
        let chartB = null;
        let pb = null;
        if (input.profileIdB) {
            pb = await this.loadProfile(input.profileIdB);
            chartB = await this.fetchChartForProfile(pb);
        }
        const personLabel = pb ? `${pa.name} & ${pb.name}` : pa.name;
        const chartJson = chartB != null
            ? JSON.stringify({ primary: chartA, partner: chartB }).slice(0, 22000)
            : this.chartBlob(chartA);
        const dashaData = this.dashaSnippet(chartA);
        const transitData = 'Transit overlay not computed in Reports Hub v1 — rely on natal dasha windows and house lords only.';
        const htmlParts = [];
        const today = new Date().toISOString().slice(0, 10);
        const titles = {
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
            const prompt = (0, report_prompt_1.buildReportSectionPrompt)({
                language: input.language,
                minWords: sec.min,
                maxWords: sec.max,
                chartJson,
                dashaData,
                transitData,
                sectionInstructions: sec.instruction,
            });
            const gen = await this.gemini.generateContent({
                prompt,
                responseFormat: 'text',
                maxOutputTokens: 900,
                skipQuestionLog: true,
            }, undefined);
            const text = String(gen.text || '').trim();
            htmlParts.push(this.pdf.wrapProseSection(this.pdf.escapeHtml(text)));
        }
        const html = this.pdf.compileFinalPDF(htmlParts);
        let pdfBuffer;
        try {
            if (process.env.NODE_ENV === 'production') {
                const chromium = await Promise.resolve().then(() => require('@sparticuz/chromium'));
                const executablePath = await chromium.default.executablePath();
                const puppeteerModule = await Promise.resolve().then(() => require('puppeteer-core'));
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
                }
                finally {
                    await browser.close();
                }
            }
            else {
                const puppeteer = await Promise.resolve().then(() => require('puppeteer'));
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
                }
                finally {
                    await browser.close();
                }
            }
        }
        catch (e) {
            this.logger.error('Puppeteer PDF failed', e);
            throw new common_1.BadRequestException('PDF generation failed. Error: ' + e.message);
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
};
exports.ReportGenerationService = ReportGenerationService;
exports.ReportGenerationService = ReportGenerationService = ReportGenerationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [profiles_service_1.ProfilesService,
        chart_service_1.ChartService,
        gemini_service_1.GeminiService,
        pdf_utils_service_1.PdfUtilsService,
        generated_reports_service_1.GeneratedReportsService])
], ReportGenerationService);
//# sourceMappingURL=report-generation.service.js.map