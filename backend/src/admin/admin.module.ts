import { Module } from '@nestjs/common';
import { ChartModule } from '../chart/chart.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { QuestionsModule } from '../questions/questions.module';
import { GeminiModule } from '../gemini/gemini.module';
import { SarvamModule } from '../sarvam/sarvam.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ChartModule, ProfilesModule, UsersModule, QuestionsModule, GeminiModule, SarvamModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
