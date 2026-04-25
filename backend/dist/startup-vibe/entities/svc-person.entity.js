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
exports.SvcPersonEntity = void 0;
const typeorm_1 = require("typeorm");
const svc_session_entity_1 = require("./svc-session.entity");
let SvcPersonEntity = class SvcPersonEntity {
};
exports.SvcPersonEntity = SvcPersonEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => svc_session_entity_1.SvcSessionEntity, (s) => s.people, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", svc_session_entity_1.SvcSessionEntity)
], SvcPersonEntity.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'display_name', type: 'text' }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "displayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "dob", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "tob", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pob_city', type: 'text' }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "pobCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pob_lat', type: 'decimal', precision: 12, scale: 8, nullable: true }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "pobLat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pob_lon', type: 'decimal', precision: 12, scale: 8, nullable: true }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "pobLon", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pob_tz', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "pobTz", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role_preference', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcPersonEntity.prototype, "rolePreference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chart_json', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], SvcPersonEntity.prototype, "chartJson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'position_index', type: 'int' }),
    __metadata("design:type", Number)
], SvcPersonEntity.prototype, "positionIndex", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcPersonEntity.prototype, "createdAt", void 0);
exports.SvcPersonEntity = SvcPersonEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'svc_people' })
], SvcPersonEntity);
//# sourceMappingURL=svc-person.entity.js.map