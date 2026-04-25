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
exports.SvcChatThreadEntity = void 0;
const typeorm_1 = require("typeorm");
const svc_session_entity_1 = require("./svc-session.entity");
const svc_result_entity_1 = require("./svc-result.entity");
let SvcChatThreadEntity = class SvcChatThreadEntity {
};
exports.SvcChatThreadEntity = SvcChatThreadEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'session_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => svc_session_entity_1.SvcSessionEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", svc_session_entity_1.SvcSessionEntity)
], SvcChatThreadEntity.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "resultId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => svc_result_entity_1.SvcResultEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'result_id' }),
    __metadata("design:type", svc_result_entity_1.SvcResultEntity)
], SvcChatThreadEntity.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'rules_version', type: 'text' }),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "rulesVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcChatThreadEntity.prototype, "summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'message_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SvcChatThreadEntity.prototype, "messageCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcChatThreadEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'last_message_at',
        type: 'timestamptz',
        default: () => 'CURRENT_TIMESTAMP',
    }),
    __metadata("design:type", Date)
], SvcChatThreadEntity.prototype, "lastMessageAt", void 0);
exports.SvcChatThreadEntity = SvcChatThreadEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'svc_chat_threads' })
], SvcChatThreadEntity);
//# sourceMappingURL=svc-chat-thread.entity.js.map