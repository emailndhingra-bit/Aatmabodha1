import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FaqBotService } from './faq-bot.service';

class FaqBotMessageDto {
  @IsString()
  @MinLength(1)
  message!: string;

  @IsString()
  userId!: string;

  @IsString()
  language!: string;
}

@Controller('faq-bot')
export class FaqBotController {
  constructor(private readonly faqBotService: FaqBotService) {}

  @Post('message')
  @UseGuards(JwtAuthGuard)
  async message(@Req() req: any, @Body() body: FaqBotMessageDto) {
    if (body.userId !== req.user.id) {
      return { reply: 'Session mismatch — please refresh and try again.', suggestedChips: [] };
    }
    return this.faqBotService.handleMessage(body.message, body.language || 'English');
  }
}
