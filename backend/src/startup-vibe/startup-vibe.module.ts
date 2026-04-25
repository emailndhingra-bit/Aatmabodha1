import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartModule } from '../chart/chart.module';
import { ChartFetcherService } from './analysis/chart-fetcher.service';
import { PobResolveService } from './analysis/pob-resolve.service';
import { SvcChatMessageEntity } from './entities/svc-chat-message.entity';
import { SvcChatThreadEntity } from './entities/svc-chat-thread.entity';
import { SvcPersonEntity } from './entities/svc-person.entity';
import { SvcResultEntity } from './entities/svc-result.entity';
import { SvcSessionEntity } from './entities/svc-session.entity';
import { StartupVibeController } from './startup-vibe.controller';
import { StartupVibeService } from './startup-vibe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SvcSessionEntity,
      SvcPersonEntity,
      SvcResultEntity,
      SvcChatThreadEntity,
      SvcChatMessageEntity,
    ]),
    ChartModule,
  ],
  controllers: [StartupVibeController],
  providers: [StartupVibeService, PobResolveService, ChartFetcherService],
})
export class StartupVibeModule {}
