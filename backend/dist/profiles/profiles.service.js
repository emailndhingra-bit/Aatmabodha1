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
exports.ProfilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const profile_entity_1 = require("./profile.entity");
let ProfilesService = class ProfilesService {
    constructor(profilesRepository) {
        this.profilesRepository = profilesRepository;
    }
    async getUserProfiles(userId) {
        return this.profilesRepository.find({ where: { userId } });
    }
    async createProfile(userId, data) {
        const existing = await this.getUserProfiles(userId);
        if (existing.length >= 2) {
            throw new common_1.BadRequestException('Maximum 2 profiles allowed per account. You have reached your limit.');
        }
        const profile = this.profilesRepository.create({ ...data, userId });
        return this.profilesRepository.save(profile);
    }
    async deleteProfile(userId, profileId) {
        await this.profilesRepository.delete({ id: profileId, userId });
    }
    async incrementQuestions(profileId) {
        await this.profilesRepository.increment({ id: profileId }, 'questionsUsed', 1);
    }
    async getProfile(userId, profileId) {
        return this.profilesRepository.findOne({ where: { id: profileId, userId } });
    }
    async findById(profileId) {
        return this.profilesRepository.findOne({ where: { id: profileId } });
    }
    async createAdminQuickProfile(adminUserId, data) {
        const tz = data.timezone !== undefined && data.timezone !== null && String(data.timezone) !== ''
            ? String(data.timezone)
            : '5.5';
        const profile = this.profilesRepository.create({
            ...data,
            timezone: tz,
            userId: adminUserId,
            createdByAdmin: true,
            purpose: 'Test Only',
        });
        return this.profilesRepository.save(profile);
    }
    async countProfilesByUser() {
        const rows = await this.profilesRepository
            .createQueryBuilder('p')
            .select('p.userId', 'userId')
            .addSelect('COUNT(p.id)', 'cnt')
            .groupBy('p.userId')
            .getRawMany();
        const out = {};
        for (const r of rows) {
            out[r.userId] = parseInt(String(r.cnt), 10) || 0;
        }
        return out;
    }
};
exports.ProfilesService = ProfilesService;
exports.ProfilesService = ProfilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(profile_entity_1.Profile)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProfilesService);
//# sourceMappingURL=profiles.service.js.map