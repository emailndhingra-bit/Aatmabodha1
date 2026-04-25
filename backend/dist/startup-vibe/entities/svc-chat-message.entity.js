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
exports.SvcChatMessageEntity = void 0;
const typeorm_1 = require("typeorm");
const svc_chat_thread_entity_1 = require("./svc-chat-thread.entity");
let SvcChatMessageEntity = class SvcChatMessageEntity {
};
exports.SvcChatMessageEntity = SvcChatMessageEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thread_id', type: 'uuid' }),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "threadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => svc_chat_thread_entity_1.SvcChatThreadEntity, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'thread_id' }),
    __metadata("design:type", svc_chat_thread_entity_1.SvcChatThreadEntity)
], SvcChatMessageEntity.prototype, "thread", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scope_person_ids', type: 'uuid', array: true, nullable: true }),
    __metadata("design:type", Array)
], SvcChatMessageEntity.prototype, "scopePersonIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scope_kind', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "scopeKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hypothetical_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], SvcChatMessageEntity.prototype, "hypotheticalNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_in', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SvcChatMessageEntity.prototype, "tokensIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tokens_out', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SvcChatMessageEntity.prototype, "tokensOut", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cache_hit', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], SvcChatMessageEntity.prototype, "cacheHit", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'generation_ms', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SvcChatMessageEntity.prototype, "generationMs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], SvcChatMessageEntity.prototype, "createdAt", void 0);
exports.SvcChatMessageEntity = SvcChatMessageEntity = __decorate([
    (0, typeorm_1.Entity)({ name: 'svc_chat_messages' })
], SvcChatMessageEntity);
//# sourceMappingURL=svc-chat-message.entity.js.map