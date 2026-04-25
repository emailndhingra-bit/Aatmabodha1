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
exports.StartupVibeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const admin_guard_1 = require("../guards/admin.guard");
const add_person_dto_1 = require("./dto/add-person.dto");
const create_session_dto_1 = require("./dto/create-session.dto");
const startup_vibe_service_1 = require("./startup-vibe.service");
let StartupVibeController = class StartupVibeController {
    constructor(startupVibe) {
        this.startupVibe = startupVibe;
    }
    create(req, dto) {
        return this.startupVibe.createSession(req.user.id, dto);
    }
    list(req) {
        return this.startupVibe.listSessions(req.user.id);
    }
    getOne(req, id) {
        return this.startupVibe.getSession(req.user.id, id);
    }
    remove(req, id) {
        return this.startupVibe.deleteSession(req.user.id, id);
    }
    addPerson(req, id, dto) {
        return this.startupVibe.addPerson(req.user.id, id, dto);
    }
    removePerson(req, id, personId) {
        return this.startupVibe.deletePerson(req.user.id, id, personId);
    }
};
exports.StartupVibeController = StartupVibeController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_session_dto_1.CreateSessionDto]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "getOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/people'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_person_dto_1.AddPersonDto]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "addPerson", null);
__decorate([
    (0, common_1.Delete)(':id/people/:personId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('personId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StartupVibeController.prototype, "removePerson", null);
exports.StartupVibeController = StartupVibeController = __decorate([
    (0, common_1.Controller)('admin/svc/sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    __metadata("design:paramtypes", [startup_vibe_service_1.StartupVibeService])
], StartupVibeController);
//# sourceMappingURL=startup-vibe.controller.js.map