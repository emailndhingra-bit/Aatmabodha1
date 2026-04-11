import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { LogReportDto } from './dto/log-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyReports(@Req() req: any) {
    return this.reportsService.getReportsByUser(req.user.id);
  }

  @Post('log')
  @UseGuards(JwtAuthGuard)
  async logReport(@Req() req: any, @Body() body: LogReportDto) {
    return this.reportsService.logReport(
      req.user.id,
      body.profileName,
      body.reportType,
      body.title,
      body.content,
      body.language,
    );
  }
}
