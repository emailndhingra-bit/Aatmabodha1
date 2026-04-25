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
exports.GeneratedReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const fs = require("fs/promises");
const path = require("path");
const generated_report_entity_1 = require("./generated-report.entity");
let GeneratedReportsService = class GeneratedReportsService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(row) {
        const e = this.repo.create(row);
        return this.repo.save(e);
    }
    async findOne(id) {
        return this.repo.findOne({ where: { id } });
    }
    async list(page = 1, limit = 20) {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));
        const [items, total] = await this.repo.findAndCount({
            order: { createdAt: 'DESC' },
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
        });
        return { items, total, page: safePage, limit: safeLimit };
    }
    async delete(id) {
        const row = await this.findOne(id);
        if (!row)
            throw new common_1.NotFoundException('Report not found');
        if (row.pdfUrl) {
            const full = path.join(process.cwd(), 'uploads', row.pdfUrl);
            await fs.unlink(full).catch(() => { });
        }
        await this.repo.delete(id);
    }
    async getHubStats() {
        const totalGenerated = await this.repo.count();
        const startMonth = new Date();
        startMonth.setDate(1);
        startMonth.setHours(0, 0, 0, 0);
        const thisMonth = await this.repo.count({
            where: { createdAt: (0, typeorm_2.MoreThanOrEqual)(startMonth) },
        });
        const raw = await this.repo
            .createQueryBuilder('g')
            .select('AVG(g.generationDurationMs)', 'avg')
            .where('g.generationDurationMs IS NOT NULL')
            .getRawOne();
        const avgMs = parseFloat(String(raw?.avg ?? '0')) || 0;
        const avgGenerationMin = avgMs > 0 ? (avgMs / 60000).toFixed(1) : '—';
        return { totalGenerated, thisMonth, avgGenerationMin };
    }
    resolvePdfPath(pdfUrl) {
        if (!pdfUrl)
            return null;
        return path.join(process.cwd(), 'uploads', pdfUrl);
    }
};
exports.GeneratedReportsService = GeneratedReportsService;
exports.GeneratedReportsService = GeneratedReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(generated_report_entity_1.GeneratedReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GeneratedReportsService);
//# sourceMappingURL=generated-reports.service.js.map