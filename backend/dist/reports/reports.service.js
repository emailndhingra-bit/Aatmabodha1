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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("./report.entity");
let ReportsService = class ReportsService {
    constructor(repo) {
        this.repo = repo;
    }
    async logReport(userId, profileName, reportType, title, content, language) {
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
    async getAdminReports(page = 1, limit = 20, reportType) {
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
    async getReportsByUser(userId) {
        return this.repo.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async getReportStats() {
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
            where: { createdAt: (0, typeorm_2.Between)(startOfToday, endOfToday) },
        });
        const startOfWeek = this.getStartOfWeekMonday();
        const countThisWeek = await this.repo.count({
            where: { createdAt: (0, typeorm_2.Between)(startOfWeek, new Date()) },
        });
        return { countByType, countToday, countThisWeek };
    }
    getStartOfWeekMonday() {
        const now = new Date();
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map