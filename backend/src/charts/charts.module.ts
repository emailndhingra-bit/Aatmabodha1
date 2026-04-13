import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedChart } from './saved-chart.entity';
import { ChartsController } from './charts.controller';
import { ChartsService } from './charts.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavedChart])],
  controllers: [ChartsController],
  providers: [ChartsService],
})
export class ChartsModule {}
