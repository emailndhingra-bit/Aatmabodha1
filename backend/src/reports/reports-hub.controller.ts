import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { GenerateAdminReportDto } from './dto/generate-admin-report.dto';
import { GeneratedReportsService } from './generated-reports.service';
import { ReportGenerationService } from './report-generation.service';
import { ProfilesService } from '../profiles/profiles.service';

@Controller('admin/reports-hub')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsHubController {
  constructor(
    private readonly generated: GeneratedReportsService,
    private readonly generation: ReportGenerationService,
    private readonly profiles: ProfilesService,
  ) {}

  @Get('stats')
  async stats() {
    return this.generated.getHubStats();
  }

  @Get('profiles')
  async listProfiles(@Query('search') search?: string) {
    return this.profiles.listProfilesForReportsHub(search);
  }

  @Get('generated')
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const { items, total, page: pg, limit: lim } = await this.generated.list(p, l);
    return {
      page: pg,
      limit: lim,
      total,
      items: items.map((r) => ({
        id: r.id,
        reportType: r.reportType,
        person: this.personLabel(r),
        generated: r.createdAt,
        pages: r.pageCount,
        pdfUrl: r.pdfUrl,
        language: r.language,
        tier: r.tier,
      })),
    };
  }

  private personLabel(r: { meta: Record<string, unknown> | null }): string {
    const m = r.meta || {};
    const a = typeof m.personA === 'string' ? m.personA : '';
    const b = typeof m.personB === 'string' ? m.personB : '';
    if (b) return `${a} & ${b}`;
    return a || '—';
  }

  @Post('generate')
  async generate(@Req() req: any, @Body() body: GenerateAdminReportDto) {
    const email = String(req.user?.email || 'admin');
    const row = await this.generation.generate(
      {
        reportType: body.reportType,
        profileIdA: body.profileIdA,
        profileIdB: body.profileIdB,
        tier: body.tier,
        language: body.language,
        flags: body.flags,
      },
      email,
    );
    return {
      id: row.id,
      pdfUrl: row.pdfUrl,
      pageCount: row.pageCount,
      generationDurationMs: row.generationDurationMs,
    };
  }

  @Get('generated/:id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const row = await this.generated.findOne(id);
    if (!row?.pdfUrl) throw new BadRequestException('PDF not available');
    const full = this.generated.resolvePdfPath(row.pdfUrl);
    if (!full) throw new BadRequestException('Invalid path');
    try {
      await fs.access(full);
    } catch {
      throw new BadRequestException('File missing on disk');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(full)}"`);
    return res.sendFile(full);
  }

  @Delete('generated/:id')
  async remove(@Param('id') id: string) {
    await this.generated.delete(id);
    return { ok: true };
  }

  @Post('generated/:id/regenerate')
  async regenerate(@Req() req: any, @Param('id') id: string) {
    const existing = await this.generated.findOne(id);
    if (!existing) throw new BadRequestException('Report not found');
    if (!existing.profileIdA) throw new BadRequestException('Invalid stored report');
    const email = String(req.user?.email || 'admin');
    const payload = {
      reportType: existing.reportType,
      profileIdA: existing.profileIdA,
      profileIdB: existing.profileIdB ?? undefined,
      tier: existing.tier ?? undefined,
      language: existing.language,
      flags: (existing.meta?.flags as Record<string, unknown>) ?? {},
    };
    await this.generated.delete(id);
    const row = await this.generation.generate(payload, email);
    return {
      id: row.id,
      pdfUrl: row.pdfUrl,
      pageCount: row.pageCount,
      generationDurationMs: row.generationDurationMs,
    };
  }
}
