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
var StartupVibeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupVibeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chart_fetcher_service_1 = require("./analysis/chart-fetcher.service");
const pob_resolve_service_1 = require("./analysis/pob-resolve.service");
const svc_person_entity_1 = require("./entities/svc-person.entity");
const svc_session_entity_1 = require("./entities/svc-session.entity");
const MAX_PEOPLE = 8;
let StartupVibeService = StartupVibeService_1 = class StartupVibeService {
    constructor(sessions, people, pobResolve, chartFetcher) {
        this.sessions = sessions;
        this.people = people;
        this.pobResolve = pobResolve;
        this.chartFetcher = chartFetcher;
        this.logger = new common_1.Logger(StartupVibeService_1.name);
    }
    onModuleInit() {
        this.logger.log('StartupVibeModule ready (admin routes: /api/admin/svc/sessions)');
    }
    async createSession(adminUserId, dto) {
        const session = this.sessions.create({
            adminUserId,
            label: dto.label.trim(),
            industry: dto.industry ?? null,
            stage: dto.stage ?? null,
            fundingStatus: dto.fundingStatus ?? null,
            notes: dto.notes?.trim() ?? null,
        });
        await this.sessions.save(session);
        if (dto.people?.length) {
            for (let i = 0; i < dto.people.length; i++) {
                await this.addPerson(adminUserId, session.id, dto.people[i], i);
            }
        }
        return this.getSession(adminUserId, session.id);
    }
    async listSessions(adminUserId) {
        const rows = await this.sessions.find({
            where: { adminUserId },
            order: { updatedAt: 'DESC' },
            relations: ['people'],
        });
        for (const s of rows) {
            s.people?.sort((a, b) => a.positionIndex - b.positionIndex);
        }
        return Promise.all(rows.map((s) => this.decorateSession(s)));
    }
    async getSession(adminUserId, id) {
        const session = await this.sessions.findOne({
            where: { id },
            relations: ['people'],
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        this.assertOwner(session, adminUserId);
        session.people?.sort((a, b) => a.positionIndex - b.positionIndex);
        return this.decorateSession(session);
    }
    async deleteSession(adminUserId, id) {
        const session = await this.sessions.findOne({ where: { id } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        this.assertOwner(session, adminUserId);
        await this.sessions.remove(session);
        return { ok: true };
    }
    async addPerson(adminUserId, sessionId, dto, fixedIndex) {
        const session = await this.sessions.findOne({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        this.assertOwner(session, adminUserId);
        const n = await this.people.count({ where: { sessionId } });
        if (n >= MAX_PEOPLE) {
            throw new common_1.BadRequestException(`A session cannot have more than ${MAX_PEOPLE} people`);
        }
        const resolved = await this.pobResolve.resolve({
            pobCity: dto.pobCity,
            pobLat: dto.pobLat,
            pobLon: dto.pobLon,
            pobTz: dto.pobTz,
            dob: dto.dob,
            tob: dto.tob,
        });
        const pobTzStored = dto.pobTz?.trim() && !/^-?\d+(\.\d+)?$/.test(dto.pobTz.trim())
            ? dto.pobTz.trim()
            : resolved.tzIana ?? String(resolved.timezoneHours);
        const positionIndex = fixedIndex !== undefined
            ? fixedIndex
            : dto.positionIndex !== undefined
                ? dto.positionIndex
                : n;
        const person = this.people.create({
            sessionId,
            displayName: dto.displayName.trim(),
            dob: dto.dob,
            tob: dto.tob,
            pobCity: dto.pobCity.trim(),
            pobLat: String(resolved.lat),
            pobLon: String(resolved.lon),
            pobTz: pobTzStored,
            rolePreference: dto.rolePreference?.trim() ?? null,
            chartJson: null,
            positionIndex,
        });
        await this.people.save(person);
        let chart_status = 'failed';
        try {
            const chart = await this.chartFetcher.fetchChartForPerson(person);
            person.chartJson = chart;
            await this.people.save(person);
            chart_status = 'ok';
        }
        catch {
        }
        await this.touchSession(sessionId);
        return {
            person: this.serializePerson(person),
            chart_status,
        };
    }
    async deletePerson(adminUserId, sessionId, personId) {
        const session = await this.sessions.findOne({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        this.assertOwner(session, adminUserId);
        const person = await this.people.findOne({ where: { id: personId, sessionId } });
        if (!person)
            throw new common_1.NotFoundException('Person not found');
        await this.people.remove(person);
        await this.touchSession(sessionId);
        return { ok: true };
    }
    assertOwner(session, adminUserId) {
        if (session.adminUserId !== adminUserId) {
            throw new common_1.ForbiddenException('Not allowed to access this session');
        }
    }
    async touchSession(sessionId) {
        await this.sessions.update({ id: sessionId }, { updatedAt: new Date() });
    }
    serializePerson(p) {
        return {
            id: p.id,
            sessionId: p.sessionId,
            displayName: p.displayName,
            dob: p.dob,
            tob: p.tob,
            pobCity: p.pobCity,
            pobLat: p.pobLat != null ? Number(p.pobLat) : null,
            pobLon: p.pobLon != null ? Number(p.pobLon) : null,
            pobTz: p.pobTz,
            rolePreference: p.rolePreference,
            chartJson: p.chartJson,
            positionIndex: p.positionIndex,
            createdAt: p.createdAt,
        };
    }
    async decorateSession(session) {
        const people = (session.people ?? []).map((p) => this.serializePerson(p));
        const team_size = people.length;
        const last_analysed = null;
        return {
            id: session.id,
            adminUserId: session.adminUserId,
            label: session.label,
            industry: session.industry,
            stage: session.stage,
            fundingStatus: session.fundingStatus,
            notes: session.notes,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            team_size,
            last_analysed,
            people,
        };
    }
};
exports.StartupVibeService = StartupVibeService;
exports.StartupVibeService = StartupVibeService = StartupVibeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(svc_session_entity_1.SvcSessionEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(svc_person_entity_1.SvcPersonEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        pob_resolve_service_1.PobResolveService,
        chart_fetcher_service_1.ChartFetcherService])
], StartupVibeService);
//# sourceMappingURL=startup-vibe.service.js.map