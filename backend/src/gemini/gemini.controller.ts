import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { QuestionsService } from '../questions/questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('')
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly questionsService: QuestionsService,
  ) {}

  @Post('gemini')
  async geminiProxy(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.geminiService.generateContent(body, userId);
  }

  @Post('gemini-chat')
  async geminiChat(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id;
    return this.geminiService.chat(body, userId);
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
}
