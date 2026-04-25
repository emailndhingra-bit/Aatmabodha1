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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("../guards/admin.guard");
const admin_service_1 = require("./admin.service");
const admin_quick_chart_dto_1 = require("./dto/admin-quick-chart.dto");
const admin_oracle_audio_dto_1 = require("./dto/admin-oracle-audio.dto");
const update_quota_dto_1 = require("./dto/update-quota.dto");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async quickChart(req, body) {
        return this.adminService.quickChart(req.user, body);
    }
    async listUsers() {
        return this.adminService.listUsersForAdmin();
    }
    async patchQuota(userId, body) {
        return this.adminService.setUserQuota(userId, body.quota);
    }
    async oracleAudio(body) {
        return this.adminService.oracleAudio(body);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('quick-chart'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_quick_chart_dto_1.AdminQuickChartDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "quickChart", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:userId/quota'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_quota_dto_1.UpdateQuotaDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "patchQuota", null);
__decorate([
    (0, common_1.Post)('oracle/audio'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_oracle_audio_dto_1.AdminOracleAudioDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "oracleAudio", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map