import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Query,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { QuestionsService } from '../questions/questions.service';
import { ReportsService } from '../reports/reports.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@Controller('')
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly questionsService: QuestionsService,
    private readonly reportsService: ReportsService,
    private readonly usersService: UsersService,
  ) {}

  private assertAdminEmail(req: any): void {
    if (req.user?.email !== process.env.ADMIN_EMAIL) {
      throw new UnauthorizedException('Admin only');
    }
  }

  @Post('gemini')
  @UseGuards(OptionalJwtGuard)
  async geminiProxy(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    if (userId) {
      const user = await this.usersService.findById(userId);
      if (!user) throw new UnauthorizedException('User not found');
      if (user.status !== 'approved') throw new ForbiddenException('Account not approved');
      if (user.questionsUsed >= user.questionsLimit) {
        throw new ForbiddenException('Question limit reached (' + user.questionsLimit + ' questions)');
      }
    }
    const result = await this.geminiService.generateContent(body, userId);
    if (userId) {
      await this.usersService.incrementQuestionsUsed(userId).catch(() => {});
    }
    return result;
  }

  @Post('gemini-chat')
  @UseGuards(OptionalJwtGuard)
  async geminiChat(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    if (userId) {
      const user = await this.usersService.findById(userId);
      if (!user) throw new UnauthorizedException('User not found');
      if (user.status !== 'approved') throw new ForbiddenException('Account not approved');
      if (user.questionsUsed >= user.questionsLimit) {
        throw new ForbiddenException('Question limit reached (' + user.questionsLimit + ' questions)');
      }
    }
    const result = await this.geminiService.chat(body, userId);
    if (userId) {
      await this.usersService.incrementQuestionsUsed(userId).catch(() => {});
    }
    return result;
  }

  @Post('gemini-image')
  async geminiImage(@Body() body: any) {
    return this.geminiService.generateImage(body);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    const stats = await this.questionsService.getStats();
    const cache = this.geminiService.getCacheStats();
    return { ...stats, cache };
  }

  @Get('admin/reports/stats')
  @UseGuards(JwtAuthGuard)
  async getAdminReportStats(@Req() req: any) {
    this.assertAdminEmail(req);
    const raw = await this.reportsService.getReportStats();
    const countByType: Record<string, number> = {};
    for (const row of raw.countByType) {
      countByType[row.reportType] = parseInt(String(row.count), 10);
    }
    const totalReports = Object.values(countByType).reduce((a, b) => a + b, 0);
    return {
      totalReports,
      todayCount: raw.countToday,
      weekCount: raw.countThisWeek,
      countByType,
    };
  }

  @Get('admin/reports')
  @UseGuards(JwtAuthGuard)
  async getAdminReports(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    this.assertAdminEmail(req);
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '50', 10) || 50));
    const result = await this.reportsService.getAdminReports(p, l, type || undefined);
    return {
      page: result.page,
      limit: result.limit,
      total: result.total,
      items: result.items.map((r) => ({
        id: r.id,
        userId: r.userId,
        profileName: r.profileName,
        reportType: r.reportType,
        title: r.title,
        contentPreview: r.contentPreview,
        language: r.language,
        createdAt: r.createdAt,
      })),
    };
  }
}
