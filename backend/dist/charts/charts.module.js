"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const saved_chart_entity_1 = require("./saved-chart.entity");
const charts_controller_1 = require("./charts.controller");
const charts_service_1 = require("./charts.service");
let ChartsModule = class ChartsModule {
};
exports.ChartsModule = ChartsModule;
exports.ChartsModule = ChartsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([saved_chart_entity_1.SavedChart])],
        controllers: [charts_controller_1.ChartsController],
        providers: [charts_service_1.ChartsService],
    })
], ChartsModule);
//# sourceMappingURL=charts.module.js.map