"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const chart_module_1 = require("../chart/chart.module");
const profiles_module_1 = require("../profiles/profiles.module");
const users_module_1 = require("../users/users.module");
const questions_module_1 = require("../questions/questions.module");
const gemini_module_1 = require("../gemini/gemini.module");
const sarvam_module_1 = require("../sarvam/sarvam.module");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [chart_module_1.ChartModule, profiles_module_1.ProfilesModule, users_module_1.UsersModule, questions_module_1.QuestionsModule, gemini_module_1.GeminiModule, sarvam_module_1.SarvamModule],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map