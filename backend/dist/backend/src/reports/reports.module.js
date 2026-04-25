"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const report_entity_1 = require("./report.entity");
const generated_report_entity_1 = require("./generated-report.entity");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const reports_hub_controller_1 = require("./reports-hub.controller");
const generated_reports_service_1 = require("./generated-reports.service");
const report_generation_service_1 = require("./report-generation.service");
const pdf_utils_service_1 = require("./pdf-utils.service");
const chart_module_1 = require("../chart/chart.module");
const gemini_module_1 = require("../gemini/gemini.module");
const profiles_module_1 = require("../profiles/profiles.module");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([report_entity_1.Report, generated_report_entity_1.GeneratedReport]),
            chart_module_1.ChartModule,
            (0, common_1.forwardRef)(() => gemini_module_1.GeminiModule),
            profiles_module_1.ProfilesModule,
        ],
        providers: [
            reports_service_1.ReportsService,
            generated_reports_service_1.GeneratedReportsService,
            pdf_utils_service_1.PdfUtilsService,
            report_generation_service_1.ReportGenerationService,
        ],
        controllers: [reports_controller_1.ReportsController, reports_hub_controller_1.ReportsHubController],
        exports: [reports_service_1.ReportsService, generated_reports_service_1.GeneratedReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map