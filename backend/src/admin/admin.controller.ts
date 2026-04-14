import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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

  @Post('oracle/audio')
  async oracleAudio(@Body() body: AdminOracleAudioDto) {
    return this.adminService.oracleAudio(body);
  }
}
