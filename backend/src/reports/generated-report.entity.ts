import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('generated_reports')
export class GeneratedReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_type' })
  reportType: string;

  @Column({ type: 'uuid', name: 'profile_id_a', nullable: true })
  profileIdA: string | null;

  @Column({ type: 'uuid', name: 'profile_id_b', nullable: true })
  profileIdB: string | null;

  @Column({ nullable: true })
  tier: string;

  @Column()
  language: string;

  /** Relative path under uploads/, e.g. reports/career-name-2026-04-14.pdf */
  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string | null;

  @Column({ type: 'int', name: 'page_count', default: 0 })
  pageCount: number;

  @Column({ name: 'generated_by' })
  generatedBy: string;

  @Column({ type: 'int', name: 'generation_duration_ms', nullable: true })
  generationDurationMs: number | null;

  @Column({ type: 'simple-json', nullable: true })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
