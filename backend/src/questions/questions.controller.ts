import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('admin/list')
  @UseGuards(JwtAuthGuard)
  async adminList() {
    await this.questionsService.categorizeAllExisting();
    return this.questionsService.getAdminQuestions(100);
  }

  @Get('recent')
  @UseGuards(JwtAuthGuard)
  async getRecent(@Req() req: any) {
    const rows = await this.questionsService.getRecentByUser(req.user.id, 5);
    return rows.map((q) => ({
      question: q.questionText,
      daysAgo: Math.floor((Date.now() - new Date(q.createdAt).getTime()) / 86400000),
      date: q.createdAt,
      language: q.language,
    }));
  }
}
