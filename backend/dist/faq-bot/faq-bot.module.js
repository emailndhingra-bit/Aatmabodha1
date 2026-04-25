"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqBotModule = void 0;
const common_1 = require("@nestjs/common");
const gemini_module_1 = require("../gemini/gemini.module");
const faq_bot_controller_1 = require("./faq-bot.controller");
const faq_bot_service_1 = require("./faq-bot.service");
let FaqBotModule = class FaqBotModule {
};
exports.FaqBotModule = FaqBotModule;
exports.FaqBotModule = FaqBotModule = __decorate([
    (0, common_1.Module)({
        imports: [gemini_module_1.GeminiModule],
        controllers: [faq_bot_controller_1.FaqBotController],
        providers: [faq_bot_service_1.FaqBotService],
    })
], FaqBotModule);
//# sourceMappingURL=faq-bot.module.js.map