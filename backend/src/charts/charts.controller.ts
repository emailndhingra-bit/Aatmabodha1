import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { ChartsService } from './charts.service';

@Controller('saved-charts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ChartsController {
  constructor(private readonly chartsService: ChartsService) {}

  @Get()
  getCharts(@Request() req: { user: { email: string } }) {
    return this.chartsService.getCharts(req.user.email);
  }

  @Post()
  saveChart(@Request() req: { user: { email: string } }, @Body() body: any) {
    return this.chartsService.saveChart(req.user.email, body);
  }

  @Delete(':id')
  deleteChart(@Request() req: { user: { email: string } }, @Param('id') id: string) {
    return this.chartsService.deleteChart(id, req.user.email);
  }

  @Patch(':id/pin')
  togglePin(@Request() req: { user: { email: string } }, @Param('id') id: string) {
    return this.chartsService.togglePin(id, req.user.email);
  }

  @Patch(':id')
  updateChart(@Request() req: { user: { email: string } }, @Param('id') id: string, @Body() body: any) {
    return this.chartsService.updateChart(id, req.user.email, body);
  }
}
