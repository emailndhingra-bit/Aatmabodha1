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
exports.ChartService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chartRequest_entity_1 = require("./chartRequest.entity");
let ChartService = class ChartService {
    constructor(chartReqRepo) {
        this.chartReqRepo = chartReqRepo;
    }
    chartApiUrl() {
        const baseUrl = process.env.CHART_API_URL ?? 'https://flask-creator-nitingauri2008.replit.app';
        return `${baseUrl.replace(/\/$/, '')}/api/chart`;
    }
    chartTimeoutMs(options) {
        return (options?.timeoutMs ??
            (process.env.CHART_API_TIMEOUT_MS ? Number(process.env.CHART_API_TIMEOUT_MS) : 60_000));
    }
    async postChartToReplit(body, options) {
        return axios_1.default.post(this.chartApiUrl(), body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: this.chartTimeoutMs(options),
        });
    }
    async fetchChartFresh(body, options) {
        const res = await this.postChartToReplit(body, options);
        return res.data;
    }
    async fetchReplitResponseAsText(body, options) {
        const res = await axios_1.default.post(this.chartApiUrl(), body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: this.chartTimeoutMs(options),
            responseType: 'text',
            transformResponse: [(data) => data],
        });
        return typeof res.data === 'string' ? res.data : String(res.data ?? '');
    }
    async createChart(body, options) {
        const rec = this.chartReqRepo.create({
            requestBody: body,
            responseBody: null,
            errorMessage: null,
        });
        await this.chartReqRepo.save(rec);
        try {
            const res = await this.postChartToReplit(body, options);
            rec.responseBody = res.data;
            await this.chartReqRepo.save(rec);
            return res.data;
        }
        catch (e) {
            rec.errorMessage = e?.message ? String(e.message) : 'Unknown error';
            await this.chartReqRepo.save(rec);
            throw e;
        }
    }
};
exports.ChartService = ChartService;
exports.ChartService = ChartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chartRequest_entity_1.ChartRequestEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ChartService);
//# sourceMappingURL=chart.service.js.map