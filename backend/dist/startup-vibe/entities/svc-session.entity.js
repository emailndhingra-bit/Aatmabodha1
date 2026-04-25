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
exports.SvcSessionEntity = void 0;
const typeorm_1 = require("typeorm");
const svc_person_entity_1 = require("./svc-person.entity");
let SvcSessionEntity = class SvcSessionEntity {
};
exports.SvcSessionEntity = SvcSessionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'admin_user_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "adminUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "industry", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "stage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'funding_status', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "fundingStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcSessionEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcSessionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcSessionEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => svc_person_entity_1.SvcPersonEntity, (p) => p.session, { cascade: true }),
    __metadata("design:type", Array)
], SvcSessionEntity.prototype, "people", void 0);
exports.SvcSessionEntity = SvcSessionEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'svc_sessions' })
], SvcSessionEntity);
//# sourceMappingURL=svc-session.entity.js.map