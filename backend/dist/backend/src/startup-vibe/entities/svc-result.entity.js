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
exports.SvcResultEntity = void 0;
const typeorm_1 = require("typeorm");
const svc_session_entity_1 = require("./svc-session.entity");
let SvcResultEntity = class SvcResultEntity {
};
exports.SvcResultEntity = SvcResultEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SvcResultEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcResultEntity.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => svc_session_entity_1.SvcSessionEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", svc_session_entity_1.SvcSessionEntity)
], SvcResultEntity.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rules_version', type: 'text' }),
    __metadata("design:type", String)
], SvcResultEntity.prototype, "rulesVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_json', type: 'jsonb' }),
    __metadata("design:type", Object)
], SvcResultEntity.prototype, "resultJson", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'generated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcResultEntity.prototype, "generatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'generation_ms', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SvcResultEntity.prototype, "generationMs", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cache_hit', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SvcResultEntity.prototype, "cacheHit", void 0);
exports.SvcResultEntity = SvcResultEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'svc_results' })
], SvcResultEntity);
//# sourceMappingURL=svc-result.entity.js.map