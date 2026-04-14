import { Module } from '@nestjs/common';
import { GeminiModule } from '../gemini/gemini.module';
import { FaqBotController } from './faq-bot.controller';
import { FaqBotService } from './faq-bot.service';

@Module({
  imports: [GeminiModule],
  controllers: [FaqBotController],
  providers: [FaqBotService],
})
export class FaqBotModule {}
