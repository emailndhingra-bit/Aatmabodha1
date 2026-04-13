import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('admin/counts')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminProfileCounts() {
    return this.profilesService.countProfilesByUser();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async adminListProfiles(@Query('userId') userId: string) {
    if (!userId) throw new BadRequestException('userId query parameter is required');
    return this.profilesService.getUserProfiles(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyProfiles(@Req() req: any) {
    return this.profilesService.getUserProfiles(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProfile(@Req() req: any, @Body() body: any) {
    return this.profilesService.createProfile(req.user.id, {
      name: body.name,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      timeOfBirth: body.timeOfBirth,
      placeOfBirth: body.placeOfBirth,
      latitude: body.latitude,
      longitude: body.longitude,
      timezone: body.timezone,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProfile(@Req() req: any, @Param('id') id: string) {
    await this.profilesService.deleteProfile(req.user.id, id);
    return { message: 'Profile deleted' };
  }
}
