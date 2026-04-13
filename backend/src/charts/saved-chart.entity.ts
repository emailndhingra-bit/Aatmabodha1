import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('saved_charts')
export class SavedChart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminEmail: string;

  @Column()
  chartName: string;

  @Column({ type: 'text' })
  chartType: string;
  // 'bar' | 'line' | 'doughnut' | 'pie' | 'scatter'

  @Column({ type: 'text' })
  chartConfig: string;
  // JSON stringified Chart.js config

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  xAxis: string;
  // Which field on x axis

  @Column({ type: 'text', nullable: true })
  yAxis: string;
  // Which field on y axis

  @Column({ type: 'text', nullable: true })
  groupBy: string;
  // Optional grouping field

  @Column({ default: false })
  isPinned: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
