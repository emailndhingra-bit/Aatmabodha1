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
var ChartFetcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChartFetcherService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const chart_service_1 = require("../../chart/chart.service");
const chart_payload_util_1 = require("../../reports/chart-payload.util");
const pob_resolve_service_1 = require("./pob-resolve.service");
const NUMERIC_TZ = /^-?\d+(\.\d+)?$/;
let ChartFetcherService = ChartFetcherService_1 = class ChartFetcherService {
    constructor(chartService, pobResolve) {
        this.chartService = chartService;
        this.pobResolve = pobResolve;
    }
    async fetchChartForPerson(person) {
        const tob = (person.tob || '').trim();
        if (!tob) {
            throw new common_1.BadRequestException('Time of birth is required');
        }
        const lat = person.pobLat != null ? Number(person.pobLat) : Number.NaN;
        const lon = person.pobLon != null ? Number(person.pobLon) : Number.NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            throw new common_1.BadRequestException('Latitude and longitude are required before chart fetch');
        }
        const tzRaw = person.pobTz?.trim();
        if (!tzRaw) {
            throw new common_1.BadRequestException('Timezone is required before chart fetch');
        }
        const tobNorm = this.normalizeTob(tob);
        const tzNum = NUMERIC_TZ.test(tzRaw)
            ? parseFloat(tzRaw)
            : this.pobResolve.offsetHoursAtLocalWallClock(tzRaw, person.dob, tobNorm);
        if (!Number.isFinite(tzNum)) {
            throw new common_1.BadRequestException('Invalid timezone for chart fetch');
        }
        const payload = (0, chart_payload_util_1.chartPayloadFromProfileFields)({
            dateOfBirth: person.dob,
            timeOfBirth: tobNorm,
            latitude: lat,
            longitude: lon,
            timezone: tzNum,
        });
        try {
            const data = await this.chartService.createChart({
                date_of_birth: payload.date_of_birth,
                time_of_birth: payload.time_of_birth,
                latitude: payload.latitude,
                longitude: payload.longitude,
                timezone: String(payload.timezone),
            }, { timeoutMs: ChartFetcherService_1.TIMEOUT_MS });
            return data;
        }
        catch (e) {
            if (axios_1.default.isAxiosError(e) && e.code === 'ECONNABORTED') {
                throw new common_1.RequestTimeoutException('Chart service timed out');
            }
            throw e;
        }
    }
    normalizeTob(tob) {
        const [h, m] = tob.split(':');
        const hh = String(Number(h)).padStart(2, '0');
        const mm = String(Number(m ?? 0)).padStart(2, '0');
        return `${hh}:${mm}`;
    }
};
exports.ChartFetcherService = ChartFetcherService;
ChartFetcherService.TIMEOUT_MS = 15_000;
exports.ChartFetcherService = ChartFetcherService = ChartFetcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chart_service_1.ChartService,
        pob_resolve_service_1.PobResolveService])
], ChartFetcherService);
//# sourceMappingURL=chart-fetcher.service.js.map