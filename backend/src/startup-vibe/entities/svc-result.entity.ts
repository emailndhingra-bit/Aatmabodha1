import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SvcSessionEntity } from './svc-session.entity';

@Entity({ name: 'svc_results' })
export class SvcResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => SvcSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: SvcSessionEntity;

  @Column({ name: 'rules_version', type: 'text' })
  rulesVersion!: string;

  @Column({ name: 'result_json', type: 'jsonb' })
  resultJson!: Record<string, unknown>;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;

  @Column({ name: 'generation_ms', type: 'int', nullable: true })
  generationMs!: number | null;

  @Column({ name: 'cache_hit', type: 'boolean', default: false })
  cacheHit!: boolean;
}
