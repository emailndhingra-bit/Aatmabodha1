"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PobResolveService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const luxon_1 = require("luxon");
const NUMERIC_TZ = /^-?\d+(\.\d+)?$/;
let PobResolveService = class PobResolveService {
    async resolve(input) {
        const { pobCity, dob, tob } = input;
        let lat = input.pobLat;
        let lon = input.pobLon;
        const hasLatLon = lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon);
        let tzIanaFromGeo = null;
        if (!hasLatLon) {
            const geo = await this.geocodeCity(pobCity);
            lat = geo.latitude;
            lon = geo.longitude;
            tzIanaFromGeo = geo.timezone ?? null;
        }
        const rawTz = input.pobTz?.trim();
        if (rawTz && NUMERIC_TZ.test(rawTz)) {
            return {
                lat: lat,
                lon: lon,
                timezoneHours: parseFloat(rawTz),
                tzIana: null,
            };
        }
        if (rawTz && !NUMERIC_TZ.test(rawTz)) {
            const hours = this.offsetHoursAtLocalWallClock(rawTz, dob, tob);
            if (!Number.isFinite(hours)) {
                throw new common_1.BadRequestException('Invalid timezone identifier');
            }
            return { lat: lat, lon: lon, timezoneHours: hours, tzIana: rawTz };
        }
        const iana = tzIanaFromGeo ?? (hasLatLon ? (await this.reverseGeocode(lat, lon))?.timezone : null) ?? null;
        if (!iana) {
            throw new common_1.BadRequestException('Could not resolve timezone for place of birth');
        }
        const hours = this.offsetHoursAtLocalWallClock(iana, dob, tob);
        if (!Number.isFinite(hours)) {
            throw new common_1.BadRequestException('Could not resolve timezone for place of birth');
        }
        return { lat: lat, lon: lon, timezoneHours: hours, tzIana: iana };
    }
    async geocodeCity(city) {
        const q = city.trim();
        if (!q) {
            throw new common_1.BadRequestException('pob_city is required');
        }
        try {
            const res = await axios_1.default.get('https://geocoding-api.open-meteo.com/v1/search', {
                params: { name: q, count: 1 },
                timeout: 12_000,
                headers: { 'User-Agent': 'AatmabodhaStartupVibe/1.0' },
            });
            const hit = res.data?.results?.[0];
            if (!hit) {
                throw new common_1.BadRequestException('Place of birth could not be resolved (no geocoding results)');
            }
            return hit;
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            throw new common_1.BadRequestException('Place of birth geocoding failed');
        }
    }
    async reverseGeocode(lat, lon) {
        try {
            const res = await axios_1.default.get('https://geocoding-api.open-meteo.com/v1/search', {
                params: { latitude: lat, longitude: lon, count: 1 },
                timeout: 12_000,
                headers: { 'User-Agent': 'AatmabodhaStartupVibe/1.0' },
            });
            return res.data?.results?.[0] ?? null;
        }
        catch {
            return null;
        }
    }
    offsetHoursAtLocalWallClock(iana, dob, tob) {
        const [y, m, d] = dob.split('-').map(Number);
        const [hhRaw, mmRaw] = tob.split(':').map(Number);
        const dt = luxon_1.DateTime.fromObject({ year: y, month: m, day: d, hour: hhRaw, minute: mmRaw ?? 0 }, { zone: iana });
        if (!dt.isValid) {
            return Number.NaN;
        }
        return dt.offset / 60;
    }
};
exports.PobResolveService = PobResolveService;
exports.PobResolveService = PobResolveService = __decorate([
    (0, common_1.Injectable)()
], PobResolveService);
//# sourceMappingURL=pob-resolve.service.js.map