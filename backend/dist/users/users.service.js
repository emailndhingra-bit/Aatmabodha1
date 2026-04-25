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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usersRepository.findOne({ where: { id } });
    }
    async findByGoogleId(googleId) {
        return this.usersRepository.findOne({ where: { googleId } });
    }
    async createUser(data) {
        const user = this.usersRepository.create(data);
        return this.usersRepository.save(user);
    }
    async updateUser(id, data) {
        await this.usersRepository.update(id, data);
        return this.findById(id);
    }
    async getAllPendingUsers() {
        return this.usersRepository.find({ where: { status: user_entity_1.UserStatus.PENDING } });
    }
    async getAllUsers() {
        return this.usersRepository.find();
    }
    async approveUser(id) {
        return this.updateUser(id, { status: user_entity_1.UserStatus.APPROVED });
    }
    async rejectUser(id) {
        return this.updateUser(id, { status: user_entity_1.UserStatus.REJECTED });
    }
    async incrementQuestions(id) {
        const user = await this.findById(id);
        return this.updateUser(id, { questionsUsed: user.questionsUsed + 1 });
    }
    async incrementQuestionsUsed(id) {
        await this.usersRepository.increment({ id }, 'questionsUsed', 1);
    }
    getEffectiveQuota(user) {
        if (!user)
            return 60;
        if (user.customQuota != null)
            return user.customQuota;
        return 60;
    }
    isUnlimitedQuota(user) {
        return user != null && user.customQuota === 0;
    }
    hasQuotaRemaining(user) {
        if (!user)
            return false;
        const cap = this.getEffectiveQuota(user);
        if (cap === 0)
            return true;
        return user.questionsUsed < cap;
    }
    async canAskQuestion(id) {
        const user = await this.findById(id);
        if (!user)
            return false;
        return user.status === user_entity_1.UserStatus.APPROVED && this.hasQuotaRemaining(user);
    }
    async setCustomQuota(userId, quota) {
        await this.usersRepository.update(userId, { customQuota: quota });
        return this.findById(userId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map