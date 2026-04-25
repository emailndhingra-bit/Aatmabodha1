"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const chart_module_1 = require("./chart/chart.module");
const gemini_module_1 = require("./gemini/gemini.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const profiles_module_1 = require("./profiles/profiles.module");
const questions_module_1 = require("./questions/questions.module");
const reports_module_1 = require("./reports/reports.module");
const charts_module_1 = require("./charts/charts.module");
const admin_module_1 = require("./admin/admin.module");
const faq_bot_module_1 = require("./faq-bot/faq-bot.module");
const env_validation_1 = require("./config/env.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '.env.local'],
                validate: env_validation_1.validateEnv,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'postgres',
                    host: config.get('DB_HOST', 'localhost'),
                    port: Number(config.get('DB_PORT', '5432')),
                    username: config.get('DB_USER', 'postgres'),
                    password: config.get('DB_PASSWORD', 'postgres'),
                    database: config.get('DB_NAME', 'aatmabodha'),
                    ssl: {
                        rejectUnauthorized: false,
                    },
                    autoLoadEntities: true,
                    synchronize: config.get('DB_SYNC', 'true') === 'true',
                }),
            }),
            chart_module_1.ChartModule,
            gemini_module_1.GeminiModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            profiles_module_1.ProfilesModule,
            questions_module_1.QuestionsModule,
            reports_module_1.ReportsModule,
            charts_module_1.ChartsModule,
            admin_module_1.AdminModule,
            faq_bot_module_1.FaqBotModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map