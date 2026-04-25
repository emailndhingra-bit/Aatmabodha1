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
exports.FaqBotController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const faq_bot_service_1 = require("./faq-bot.service");
class FaqBotMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], FaqBotMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FaqBotMessageDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FaqBotMessageDto.prototype, "language", void 0);
let FaqBotController = class FaqBotController {
    constructor(faqBotService) {
        this.faqBotService = faqBotService;
    }
    async message(req, body) {
        if (body.userId !== req.user.id) {
            return { reply: 'Session mismatch — please refresh and try again.', suggestedChips: [] };
        }
        return this.faqBotService.handleMessage(body.message, body.language || 'English');
    }
};
exports.FaqBotController = FaqBotController;
__decorate([
    (0, common_1.Post)('message'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, FaqBotMessageDto]),
    __metadata("design:returntype", Promise)
], FaqBotController.prototype, "message", null);
exports.FaqBotController = FaqBotController = __decorate([
    (0, common_1.Controller)('faq-bot'),
    __metadata("design:paramtypes", [faq_bot_service_1.FaqBotService])
], FaqBotController);
//# sourceMappingURL=faq-bot.controller.js.map