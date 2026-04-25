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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const chart_service_1 = require("../chart/chart.service");
const profiles_service_1 = require("../profiles/profiles.service");
const users_service_1 = require("../users/users.service");
const gemini_service_1 = require("../gemini/gemini.service");
const sarvam_service_1 = require("../sarvam/sarvam.service");
const ist_chart_payload_util_1 = require("./ist-chart-payload.util");
const oracle_tts_system_1 = require("./oracle-tts.system");
let AdminService = class AdminService {
    constructor(chartService, profilesService, usersService, geminiService, sarvamService) {
        this.chartService = chartService;
        this.profilesService = profilesService;
        this.usersService = usersService;
        this.geminiService = geminiService;
        this.sarvamService = sarvamService;
    }
    async quickChart(admin, dto) {
        const body = {
            date_of_birth: dto.date_of_birth,
            time_of_birth: dto.time_of_birth,
            latitude: dto.latitude,
            longitude: dto.longitude,
            timezone: dto.timezone ?? 5.5,
        };
        const chart = await this.chartService.createChart(body);
        let profile = null;
        if (dto.permanent) {
            profile = await this.profilesService.createAdminQuickProfile(admin.id, {
                name: dto.name,
                gender: dto.gender ?? undefined,
                dateOfBirth: dto.storageDateOfBirth ?? dto.date_of_birth,
                timeOfBirth: dto.storageTimeOfBirth ?? dto.time_of_birth,
                placeOfBirth: dto.placeOfBirth ?? undefined,
                latitude: dto.latitude,
                longitude: dto.longitude,
                timezone: dto.timezone ?? 5.5,
            });
        }
        return { chart, profile };
    }
    async listUsersForAdmin() {
        const users = await this.usersService.getAllUsers();
        return users.map((u) => this.toAdminUserRow(u));
    }
    toAdminUserRow(u) {
        const cap = this.usersService.getEffectiveQuota(u);
        return {
            id: u.id,
            email: u.email,
            name: u.name,
            status: u.status,
            picture: u.picture,
            questionsUsed: u.questionsUsed,
            questionsLimit: u.questionsLimit,
            customQuota: u.customQuota,
            current_quota: cap,
            quota_source: u.customQuota != null ? 'custom' : 'default',
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
        };
    }
    async setUserQuota(userId, quota) {
        const updated = await this.usersService.setCustomQuota(userId, quota);
        if (!updated)
            throw new common_1.NotFoundException('User not found');
        return this.toAdminUserRow(updated);
    }
    async oracleAudio(dto) {
        const profile = await this.profilesService.findById(dto.profileId);
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const lat = profile.latitude != null ? Number(profile.latitude) : Number.NaN;
        const lon = profile.longitude != null ? Number(profile.longitude) : Number.NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw new common_1.NotFoundException('Profile missing coordinates');
        }
        const payload = (0, ist_chart_payload_util_1.chartPayloadFromProfileFields)({
            dateOfBirth: profile.dateOfBirth,
            timeOfBirth: profile.timeOfBirth,
            latitude: lat,
            longitude: lon,
            timezone: profile.timezone != null ? Number(profile.timezone) : 5.5,
        });
        const chartJson = await this.chartService.createChart(payload);
        const chartStr = JSON.stringify(chartJson).slice(0, 18_000);
        const prompt = `${oracle_tts_system_1.ORACLE_TTS_SYSTEM}

CHART_JSON:
${chartStr}

USER_QUESTION:
${dto.question}

Target TTS language code: ${dto.language}. Write the answer mainly in that locale's conversational style (still allow light Hinglish if natural).`;
        const gen = await this.geminiService.generateContent({
            prompt,
            responseFormat: 'text',
            maxOutputTokens: 640,
            skipQuestionLog: true,
        }, undefined);
        const text = String(gen.text || '').trim();
        const audioBase64 = await this.sarvamService.textToSpeech(text, dto.language);
        return { text, audioBase64, language: dto.language };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chart_service_1.ChartService,
        profiles_service_1.ProfilesService,
        users_service_1.UsersService,
        gemini_service_1.GeminiService,
        sarvam_service_1.SarvamService])
], AdminService);
//# sourceMappingURL=admin.service.js.map