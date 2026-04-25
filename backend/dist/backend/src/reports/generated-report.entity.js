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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedReport = void 0;
const typeorm_1 = require("typeorm");
let GeneratedReport = class GeneratedReport {
};
exports.GeneratedReport = GeneratedReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GeneratedReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'report_type' }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'profile_id_a', nullable: true }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "profileIdA", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'profile_id_b', nullable: true }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "profileIdB", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GeneratedReport.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pdf_url', nullable: true }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "pdfUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'page_count', default: 0 }),
    __metadata("design:type", Number)
], GeneratedReport.prototype, "pageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'generated_by' }),
    __metadata("design:type", String)
], GeneratedReport.prototype, "generatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'generation_duration_ms', nullable: true }),
    __metadata("design:type", Number)
], GeneratedReport.prototype, "generationDurationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-json', nullable: true }),
    __metadata("design:type", Object)
], GeneratedReport.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], GeneratedReport.prototype, "createdAt", void 0);
exports.GeneratedReport = GeneratedReport = __decorate([
    (0, typeorm_1.Entity)('generated_reports')
], GeneratedReport);
//# sourceMappingURL=generated-report.entity.js.map