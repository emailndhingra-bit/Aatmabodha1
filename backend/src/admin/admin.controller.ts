import { Body, Controller, Get, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminQuickChartDto } from './dto/admin-quick-chart.dto';
import { AdminOracleAudioDto } from './dto/admin-oracle-audio.dto';
import { UpdateQuotaDto } from './dto/update-quota.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('quick-chart')
  async quickChart(@Req() req: any, @Body() body: AdminQuickChartDto) {
    return this.adminService.quickChart(req.user, body);
  }

  @Get('users')
  async listUsers() {
    return this.adminService.listUsersForAdmin();
  }

  @Patch('users/:userId/quota')
  async patchQuota(@Param('userId') userId: string, @Body() body: UpdateQuotaDto) {
    return this.adminService.setUserQuota(userId, body.quota);
  }

  @Get('users/:userId/profiles/:profileId/export-replit')
  async exportReplit(
    @Param('userId') userId: string,
    @Param('profileId') profileId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    await this.adminService.streamReplitExportZip(userId, profileId, res);
  }

  @Post('oracle/audio')
  async oracleAudio(@Body() body: AdminOracleAudioDto) {
    return this.adminService.oracleAudio(body);
  }
}
