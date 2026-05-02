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
exports.ConfigVersionController = void 0;
const common_1 = require("@nestjs/common");
const oracle_rules_version_1 = require("./oracle-rules-version");
let ConfigVersionController = class ConfigVersionController {
    version() {
        return { version: oracle_rules_version_1.ORACLE_RULES_VERSION };
    }
};
exports.ConfigVersionController = ConfigVersionController;
__decorate([
    (0, common_1.Get)('version'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ConfigVersionController.prototype, "version", null);
exports.ConfigVersionController = ConfigVersionController = __decorate([
    (0, common_1.Controller)('config')
], ConfigVersionController);
//# sourceMappingURL=config-version.controller.js.map