"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupVibeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const chart_module_1 = require("../chart/chart.module");
const chart_fetcher_service_1 = require("./analysis/chart-fetcher.service");
const pob_resolve_service_1 = require("./analysis/pob-resolve.service");
const svc_chat_message_entity_1 = require("./entities/svc-chat-message.entity");
const svc_chat_thread_entity_1 = require("./entities/svc-chat-thread.entity");
const svc_person_entity_1 = require("./entities/svc-person.entity");
const svc_result_entity_1 = require("./entities/svc-result.entity");
const svc_session_entity_1 = require("./entities/svc-session.entity");
const startup_vibe_controller_1 = require("./startup-vibe.controller");
const startup_vibe_service_1 = require("./startup-vibe.service");
let StartupVibeModule = class StartupVibeModule {
};
exports.StartupVibeModule = StartupVibeModule;
exports.StartupVibeModule = StartupVibeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                svc_session_entity_1.SvcSessionEntity,
                svc_person_entity_1.SvcPersonEntity,
                svc_result_entity_1.SvcResultEntity,
                svc_chat_thread_entity_1.SvcChatThreadEntity,
                svc_chat_message_entity_1.SvcChatMessageEntity,
            ]),
            chart_module_1.ChartModule,
        ],
        controllers: [startup_vibe_controller_1.StartupVibeController],
        providers: [startup_vibe_service_1.StartupVibeService, pob_resolve_service_1.PobResolveService, chart_fetcher_service_1.ChartFetcherService],
    })
], StartupVibeModule);
//# sourceMappingURL=startup-vibe.module.js.map