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
exports.ReportsHubController = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs/promises");
const path = require("path");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("../guards/admin.guard");
const generate_admin_report_dto_1 = require("./dto/generate-admin-report.dto");
const generated_reports_service_1 = require("./generated-reports.service");
const report_generation_service_1 = require("./report-generation.service");
const profiles_service_1 = require("../profiles/profiles.service");
const chart_service_1 = require("../chart/chart.service");
const chart_payload_util_1 = require("./chart-payload.util");
let ReportsHubController = class ReportsHubController {
    constructor(generated, generation, profiles, charts) {
        this.generated = generated;
        this.generation = generation;
        this.profiles = profiles;
        this.charts = charts;
    }
    async stats() {
        return this.generated.getHubStats();
    }
    async listProfiles(search) {
        return this.profiles.listProfilesForReportsHub(search);
    }
    async profileChart(profileId) {
        const p = await this.profiles.findById(profileId);
        if (!p)
            throw new common_1.BadRequestException('Profile not found');
        const lat = p.latitude != null ? Number(p.latitude) : Number.NaN;
        const lon = p.longitude != null ? Number(p.longitude) : Number.NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw new common_1.BadRequestException('Profile missing coordinates');
        }
        const tz = p.timezone != null && String(p.timezone) !== '' ? parseFloat(String(p.timezone)) : 5.5;
        const payload = (0, chart_payload_util_1.chartPayloadFromProfileFields)({
            dateOfBirth: p.dateOfBirth,
            timeOfBirth: p.timeOfBirth,
            latitude: lat,
            longitude: lon,
            timezone: tz,
        });
        return this.charts.createChart(payload);
    }
    async list(page, limit) {
        const p = Math.max(1, parseInt(page || '1', 10) || 1);
        const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
        const { items, total, page: pg, limit: lim } = await this.generated.list(p, l);
        return {
            page: pg,
            limit: lim,
            total,
            items: items.map((r) => ({
                id: r.id,
                reportType: r.reportType,
                person: this.personLabel(r),
                generated: r.createdAt,
                pages: r.pageCount,
                pdfUrl: r.pdfUrl,
                language: r.language,
                tier: r.tier,
            })),
        };
    }
    personLabel(r) {
        const m = r.meta || {};
        const a = typeof m.personA === 'string' ? m.personA : '';
        const b = typeof m.personB === 'string' ? m.personB : '';
        if (b)
            return `${a} & ${b}`;
        return a || '—';
    }
    async generate(req, body) {
        const email = String(req.user?.email || 'admin');
        const row = await this.generation.generate({
            reportType: body.reportType,
            profileIdA: body.profileIdA,
            profileIdB: body.profileIdB,
            tier: body.tier,
            language: body.language,
            flags: body.flags,
        }, email);
        return {
            id: row.id,
            pdfUrl: row.pdfUrl,
            pageCount: row.pageCount,
            generationDurationMs: row.generationDurationMs,
        };
    }
    async downloadPdf(id, res) {
        const row = await this.generated.findOne(id);
        if (!row?.pdfUrl)
            throw new common_1.BadRequestException('PDF not available');
        const full = this.generated.resolvePdfPath(row.pdfUrl);
        if (!full)
            throw new common_1.BadRequestException('Invalid path');
        try {
            await fs.access(full);
        }
        catch {
            throw new common_1.BadRequestException('File missing on disk');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(full)}"`);
        return res.sendFile(full);
    }
    async remove(id) {
        await this.generated.delete(id);
        return { ok: true };
    }
    async regenerate(req, id) {
        const existing = await this.generated.findOne(id);
        if (!existing)
            throw new common_1.BadRequestException('Report not found');
        if (!existing.profileIdA)
            throw new common_1.BadRequestException('Invalid stored report');
        const email = String(req.user?.email || 'admin');
        const payload = {
            reportType: existing.reportType,
            profileIdA: existing.profileIdA,
            profileIdB: existing.profileIdB ?? undefined,
            tier: existing.tier ?? undefined,
            language: existing.language,
            flags: existing.meta?.flags ?? {},
        };
        await this.generated.delete(id);
        const row = await this.generation.generate(payload, email);
        return {
            id: row.id,
            pdfUrl: row.pdfUrl,
            pageCount: row.pageCount,
            generationDurationMs: row.generationDurationMs,
        };
    }
};
exports.ReportsHubController = ReportsHubController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "stats", null);
__decorate([
    (0, common_1.Get)('profiles'),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "listProfiles", null);
__decorate([
    (0, common_1.Get)('profile/:profileId/chart'),
    __param(0, (0, common_1.Param)('profileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "profileChart", null);
__decorate([
    (0, common_1.Get)('generated'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_admin_report_dto_1.GenerateAdminReportDto]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('generated/:id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Delete)('generated/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('generated/:id/regenerate'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReportsHubController.prototype, "regenerate", null);
exports.ReportsHubController = ReportsHubController = __decorate([
    (0, common_1.Controller)('admin/reports-hub'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [generated_reports_service_1.GeneratedReportsService,
        report_generation_service_1.ReportGenerationService,
        profiles_service_1.ProfilesService,
        chart_service_1.ChartService])
], ReportsHubController);
//# sourceMappingURL=reports-hub.controller.js.map