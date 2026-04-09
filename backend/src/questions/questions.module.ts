import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionLog } from './question.entity';
import { QuestionsService } from './questions.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionLog])],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
