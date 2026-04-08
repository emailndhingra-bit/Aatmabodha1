import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartRequestEntity } from './chartRequest.entity';
import { ChartController } from './chart.controller';
import { ChartService } from './chart.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChartRequestEntity])],
  controllers: [ChartController],
  providers: [ChartService],
})
export class ChartModule {}

