import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddPersonDto } from './dto/add-person.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ChartFetcherService } from './analysis/chart-fetcher.service';
import { PobResolveService } from './analysis/pob-resolve.service';
import { SvcPersonEntity } from './entities/svc-person.entity';
import { SvcSessionEntity } from './entities/svc-session.entity';

const MAX_PEOPLE = 8;

@Injectable()
export class StartupVibeService implements OnModuleInit {
  private readonly logger = new Logger(StartupVibeService.name);

  constructor(
    @InjectRepository(SvcSessionEntity)
    private readonly sessions: Repository<SvcSessionEntity>,
    @InjectRepository(SvcPersonEntity)
    private readonly people: Repository<SvcPersonEntity>,
    private readonly pobResolve: PobResolveService,
    private readonly chartFetcher: ChartFetcherService,
  ) {}

  onModuleInit() {
    this.logger.log('StartupVibeModule ready (admin routes: /api/admin/svc/sessions)');
  }

  async createSession(adminUserId: string, dto: CreateSessionDto) {
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

  async listSessions(adminUserId: string) {
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

  async getSession(adminUserId: string, id: string) {
    const session = await this.sessions.findOne({
      where: { id },
      relations: ['people'],
    });
    if (!session) throw new NotFoundException('Session not found');
    this.assertOwner(session, adminUserId);
    session.people?.sort((a, b) => a.positionIndex - b.positionIndex);
    return this.decorateSession(session);
  }

  async deleteSession(adminUserId: string, id: string) {
    const session = await this.sessions.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    this.assertOwner(session, adminUserId);
    await this.sessions.remove(session);
    return { ok: true };
  }

  async addPerson(adminUserId: string, sessionId: string, dto: AddPersonDto, fixedIndex?: number) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    this.assertOwner(session, adminUserId);

    const n = await this.people.count({ where: { sessionId } });
    if (n >= MAX_PEOPLE) {
      throw new BadRequestException(`A session cannot have more than ${MAX_PEOPLE} people`);
    }

    const resolved = await this.pobResolve.resolve({
      pobCity: dto.pobCity,
      pobLat: dto.pobLat,
      pobLon: dto.pobLon,
      pobTz: dto.pobTz,
      dob: dto.dob,
      tob: dto.tob,
    });

    const pobTzStored =
      dto.pobTz?.trim() && !/^-?\d+(\.\d+)?$/.test(dto.pobTz.trim())
        ? dto.pobTz.trim()
        : resolved.tzIana ?? String(resolved.timezoneHours);

    const positionIndex =
      fixedIndex !== undefined
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

    let chart_status: 'ok' | 'failed' = 'failed';
    try {
      const chart = await this.chartFetcher.fetchChartForPerson(person);
      person.chartJson = chart;
      await this.people.save(person);
      chart_status = 'ok';
    } catch {
      /* person row kept for retry; chart_json stays null */
    }

    await this.touchSession(sessionId);

    return {
      person: this.serializePerson(person),
      chart_status,
    };
  }

  async deletePerson(adminUserId: string, sessionId: string, personId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    this.assertOwner(session, adminUserId);

    const person = await this.people.findOne({ where: { id: personId, sessionId } });
    if (!person) throw new NotFoundException('Person not found');
    await this.people.remove(person);
    await this.touchSession(sessionId);
    return { ok: true };
  }

  private assertOwner(session: SvcSessionEntity, adminUserId: string) {
    if (session.adminUserId !== adminUserId) {
      throw new ForbiddenException('Not allowed to access this session');
    }
  }

  private async touchSession(sessionId: string) {
    await this.sessions.update({ id: sessionId }, { updatedAt: new Date() });
  }

  private serializePerson(p: SvcPersonEntity) {
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

  private async decorateSession(session: SvcSessionEntity) {
    const people = (session.people ?? []).map((p) => this.serializePerson(p));
    const team_size = people.length;
    const last_analysed = null as string | null;
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
}
