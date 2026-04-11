import { Module } from '@nestjs/common';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';
import { QuestionsModule } from '../questions/questions.module';
import { ReportsModule } from '../reports/reports.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [QuestionsModule, ReportsModule, UsersModule],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
