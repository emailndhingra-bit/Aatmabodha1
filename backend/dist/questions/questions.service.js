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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const question_log_entity_1 = require("./question-log.entity");
const crypto = require("crypto");
let QuestionsService = class QuestionsService {
    constructor(repo) {
        this.repo = repo;
        this.hasNullified = false;
    }
    hashUser(userId) {
        return crypto.createHash('sha256').update(userId + 'aatmabodha_salt').digest('hex').substring(0, 12);
    }
    estimateCost(inputTokens, outputTokens) {
        const inputCost = (inputTokens / 1_000_000) * 2.00;
        const outputCost = (outputTokens / 1_000_000) * 12.00;
        return Math.round((inputCost + outputCost) * 100000) / 100000;
    }
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }
    categorizeQuestion(text) {
        const q = text.toLowerCase();
        if (q.match(/shaadi|marriage|partner|love|vivah|spouse|wife|husband|pyaar|breakup|divorce|girlfriend|boyfriend|rishta/))
            return 'MARRIAGE';
        if (q.match(/career|job|business|naukri|promotion|salary|profession|startup|vyapar|interview|resign|mlc|politics|political/))
            return 'CAREER';
        if (q.match(/health|bimari|sehat|doctor|hospital|sick|illness|pain|surgery|disease|stress|anxiety/))
            return 'HEALTH';
        if (q.match(/money|paisa|dhan|wealth|income|financial|loan|debt|savings|investment|stocks|profit/))
            return 'WEALTH';
        if (q.match(/car|gadi|vehicle|property|ghar|home|house|plot|land|flat|apartment/))
            return 'PROPERTY';
        if (q.match(/child|baccha|pregnancy|putra|santaan|son|daughter/))
            return 'CHILDREN';
        if (q.match(/travel|videsh|foreign|abroad|visa|passport/))
            return 'TRAVEL';
        if (q.match(/spiritual|soul|karma|past life|ishta|moksha|dharma|meditation|mantra/))
            return 'SPIRITUAL';
        if (q.match(/personality|nature|character|psychology|unique|trait|who am i|tattoo/))
            return 'PERSONALITY';
        if (q.match(/kab|when|timing|future|prediction|2025|2026|2027|turning point/))
            return 'TIMING';
        return 'GENERAL';
    }
    detectQuestionIntent(text) {
        const q = text.toLowerCase();
        if (/\b(worst|terrible|broken|crisis|bikhar|toot|tabah)\b/.test(q))
            return 'CRISIS';
        if (/\b(urgent|help|please|scared|afraid|dar|madad|bacha)\b/.test(q))
            return 'ANXIETY';
        if (/\b(grow|expand|want|achieve|badhna|kamyabi|safal)\b/.test(q))
            return 'AMBITION';
        if (/\b(confirm|right|correct|should|sahi|theek)\b/.test(q))
            return 'VALIDATION';
        if (/\b(curious|wonder|interesting|jaanna|shauk)\b/.test(q))
            return 'CURIOSITY';
        if (/\b(plan|when|how|strategy|kab|kaise|yojna)\b/.test(q))
            return 'PLANNING';
        return 'GENERAL';
    }
    detectEmotionalTone(text) {
        const q = text.toLowerCase();
        if (/(just\s+curious|wondering|sirf\s+jaanna)/.test(q))
            return 'CALM';
        if (/\b(please|desperate|nothing\s+works|scared|bahut\s+dar)\b/.test(q))
            return 'URGENT';
        if (/\b(help|lost|dont\s+know|do\s+not\s+know|samajh\s+nahi)\b/.test(q) || /don\x27t\s+know/.test(q))
            return 'CONFUSED';
        if (/\b(excited|hope|want|ummeed|asha)\b/.test(q))
            return 'HOPEFUL';
        if (/\b(failed|broken|worst|fail|toot\s+gaya)\b/.test(q))
            return 'DESPERATE';
        return 'NEUTRAL';
    }
    async logQuestion(data) {
        const inputTokens = this.estimateTokens(data.question);
        const outputTokens = this.estimateTokens(data.response);
        const userHash = this.hashUser(data.userId);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCount = await this.repo.count({
            where: {
                userHash,
                createdAt: (0, typeorm_2.MoreThanOrEqual)(startOfToday),
            },
        });
        const sessionDepth = todayCount + 1;
        const sessionId = data.sessionId ?? `${Date.now()}-${userHash.slice(0, 8)}`;
        const log = this.repo.create({
            userHash,
            questionText: null,
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
    async nullifyQuestionText() {
        const uncategorized = await this.repo.find({
            where: { questionCategory: (0, typeorm_2.IsNull)() },
        });
        for (const q of uncategorized) {
            await this.repo.update(q.id, {
                questionCategory: this.categorizeQuestion(q.questionText || ''),
                questionText: null,
            });
        }
        await this.repo
            .createQueryBuilder()
            .update(question_log_entity_1.QuestionLog)
            .set({ questionText: null })
            .where('questionText IS NOT NULL')
            .execute();
    }
    async getAdminQuestions(limit = 100) {
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
    async categorizeAllExisting() {
        const all = await this.repo.find();
        for (const q of all) {
            if (!q.questionCategory) {
                await this.repo.update(q.id, {
                    questionCategory: this.categorizeQuestion(q.questionText || ''),
                });
            }
        }
    }
    async getStats() {
        const totalQuestions = await this.repo.count();
        const sumRow = await this.repo
            .createQueryBuilder('q')
            .select('COALESCE(SUM(q.costUsd), 0)', 'totalCost')
            .getRawOne();
        const totalCost = parseFloat(String(sumRow?.totalCost ?? 0)) || 0;
        const cacheHits = await this.repo.count({ where: { cacheHit: true } });
        const logs = await this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
        const avgCostPerQuestion = totalQuestions > 0 ? totalCost / totalQuestions : 0;
        return {
            logs,
            totalCost,
            totalQuestions,
            cacheHits,
            avgCostPerQuestion,
        };
    }
    async getRecentQuestions(limit = 50) {
        return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
    }
    async getRecentByUser(userId, limit = 5) {
        const userHash = this.hashUser(userId);
        return this.repo.find({
            where: { userHash },
            order: { createdAt: 'DESC' },
            take: limit,
            select: ['questionText', 'createdAt', 'language'],
        });
    }
};
exports.QuestionsService = QuestionsService;
exports.QuestionsService = QuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(question_log_entity_1.QuestionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], QuestionsService);
//# sourceMappingURL=questions.service.js.map