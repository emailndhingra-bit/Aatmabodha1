import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { User } from '../users/user.entity';
import { AddPersonDto } from './dto/add-person.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { StartupVibeService } from './startup-vibe.service';

@Controller('admin/svc/sessions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StartupVibeController {
  constructor(private readonly startupVibe: StartupVibeService) {}

  @Post()
  create(@Request() req: { user: User }, @Body() dto: CreateSessionDto) {
    return this.startupVibe.createSession(req.user.id, dto);
  }

  @Get()
  list(@Request() req: { user: User }) {
    return this.startupVibe.listSessions(req.user.id);
  }

  @Get(':id')
  getOne(@Request() req: { user: User }, @Param('id', ParseUUIDPipe) id: string) {
    return this.startupVibe.getSession(req.user.id, id);
  }

  @Delete(':id')
  remove(@Request() req: { user: User }, @Param('id', ParseUUIDPipe) id: string) {
    return this.startupVibe.deleteSession(req.user.id, id);
  }

  @Post(':id/people')
  addPerson(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddPersonDto,
  ) {
    return this.startupVibe.addPerson(req.user.id, id, dto);
  }

  @Delete(':id/people/:personId')
  removePerson(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
    @Param('personId', ParseUUIDPipe) personId: string,
  ) {
    return this.startupVibe.deletePerson(req.user.id, id, personId);
  }
}
