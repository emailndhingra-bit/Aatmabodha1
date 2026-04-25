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
exports.GeminiController = void 0;
const common_1 = require("@nestjs/common");
const gemini_service_1 = require("./gemini.service");
const questions_service_1 = require("../questions/questions.service");
const reports_service_1 = require("../reports/reports.service");
const users_service_1 = require("../users/users.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_guard_1 = require("../auth/guards/optional-jwt.guard");
const admin_guard_1 = require("../guards/admin.guard");
let GeminiController = class GeminiController {
    constructor(geminiService, questionsService, reportsService, usersService) {
        this.geminiService = geminiService;
        this.questionsService = questionsService;
        this.reportsService = reportsService;
        this.usersService = usersService;
    }
    async geminiProxy(body, req) {
        const userId = req.user?.id;
        if (userId) {
            const user = await this.usersService.findById(userId);
            if (!user)
                throw new common_1.UnauthorizedException('User not found');
            if (user.status !== 'approved')
                throw new common_1.ForbiddenException('Account not approved');
            if (!this.usersService.hasQuotaRemaining(user)) {
                const cap = this.usersService.getEffectiveQuota(user);
                throw new common_1.ForbiddenException('Question limit reached (' + cap + ' questions)');
            }
        }
        const result = await this.geminiService.generateContent(body, userId);
        if (userId) {
            await this.usersService.incrementQuestionsUsed(userId).catch(() => { });
        }
        return result;
    }
    async geminiChat(body, req) {
        const userId = req.user?.id;
        let chatBody = body;
        if (userId) {
            const user = await this.usersService.findById(userId);
            if (!user)
                throw new common_1.UnauthorizedException('User not found');
            if (user.status !== 'approved')
                throw new common_1.ForbiddenException('Account not approved');
            if (!this.usersService.hasQuotaRemaining(user)) {
                const cap = this.usersService.getEffectiveQuota(user);
                throw new common_1.ForbiddenException('Question limit reached (' + cap + ' questions)');
            }
            const recentQs = await this.questionsService.getRecentByUser(userId, 5);
            const pastContext = recentQs
                .map((q) => {
                const daysAgo = Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 86400000);
                return `${daysAgo === 0 ? 'Aaj' : `${daysAgo} din pehle`}: "${q.questionText}"`;
            })
                .join('\n');
            chatBody = { ...body, pastContext };
        }
        const result = await this.geminiService.chat(chatBody, userId);
        if (userId) {
            await this.usersService.incrementQuestionsUsed(userId).catch(() => { });
        }
        return result;
    }
    async geminiImage(body) {
        return this.geminiService.generateImage(body);
    }
    async getStats() {
        const stats = await this.questionsService.getStats();
        const cache = this.geminiService.getCacheStats();
        return { ...stats, cache };
    }
    async getAdminReportStats() {
        const raw = await this.reportsService.getReportStats();
        const countByType = {};
        for (const row of raw.countByType) {
            countByType[row.reportType] = parseInt(String(row.count), 10);
        }
        const totalReports = Object.values(countByType).reduce((a, b) => a + b, 0);
        return {
            totalReports,
            todayCount: raw.countToday,
            weekCount: raw.countThisWeek,
            countByType,
        };
    }
    async getAdminReports(page, limit, type) {
        const p = Math.max(1, parseInt(page || '1', 10) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));
        const result = await this.reportsService.getAdminReports(p, l, type || undefined);
        return {
            page: result.page,
            limit: result.limit,
            total: result.total,
            items: result.items.map((r) => ({
                id: r.id,
                userId: r.userId,
                profileName: r.profileName,
                reportType: r.reportType,
                title: r.title,
                contentPreview: r.contentPreview,
                language: r.language,
                createdAt: r.createdAt,
            })),
        };
    }
};
exports.GeminiController = GeminiController;
__decorate([
    (0, common_1.Post)('gemini'),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "geminiProxy", null);
__decorate([
    (0, common_1.Post)('gemini-chat'),
    (0, common_1.UseGuards)(optional_jwt_guard_1.OptionalJwtGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "geminiChat", null);
__decorate([
    (0, common_1.Post)('gemini-image'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "geminiImage", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('admin/reports/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "getAdminReportStats", null);
__decorate([
    (0, common_1.Get)('admin/reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], GeminiController.prototype, "getAdminReports", null);
exports.GeminiController = GeminiController = __decorate([
    (0, common_1.Controller)(''),
    __metadata("design:paramtypes", [gemini_service_1.GeminiService,
        questions_service_1.QuestionsService,
        reports_service_1.ReportsService,
        users_service_1.UsersService])
], GeminiController);
//# sourceMappingURL=gemini.controller.js.map