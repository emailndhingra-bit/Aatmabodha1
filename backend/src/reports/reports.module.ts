import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { GeneratedReport } from './generated-report.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsHubController } from './reports-hub.controller';
import { GeneratedReportsService } from './generated-reports.service';
import { ReportGenerationService } from './report-generation.service';
import { PdfUtilsService } from './pdf-utils.service';
import { ChartModule } from '../chart/chart.module';
import { GeminiModule } from '../gemini/gemini.module';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, GeneratedReport]),
    ChartModule,
    forwardRef(() => GeminiModule),
    ProfilesModule,
  ],
  providers: [
    ReportsService,
    GeneratedReportsService,
    PdfUtilsService,
    ReportGenerationService,
  ],
  controllers: [ReportsController, ReportsHubController],
  exports: [ReportsService, GeneratedReportsService],
})
export class ReportsModule {}
