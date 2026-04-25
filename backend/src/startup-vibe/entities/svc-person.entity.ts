import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SvcSessionEntity } from './svc-session.entity';

@Entity({ name: 'svc_people' })
export class SvcPersonEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => SvcSessionEntity, (s) => s.people, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: SvcSessionEntity;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ type: 'date' })
  dob!: string;

  @Column({ type: 'time' })
  tob!: string;

  @Column({ name: 'pob_city', type: 'text' })
  pobCity!: string;

  @Column({ name: 'pob_lat', type: 'decimal', precision: 12, scale: 8, nullable: true })
  pobLat!: string | null;

  @Column({ name: 'pob_lon', type: 'decimal', precision: 12, scale: 8, nullable: true })
  pobLon!: string | null;

  @Column({ name: 'pob_tz', type: 'text', nullable: true })
  pobTz!: string | null;

  @Column({ name: 'role_preference', type: 'text', nullable: true })
  rolePreference!: string | null;

  @Column({ name: 'chart_json', type: 'jsonb', nullable: true })
  chartJson!: Record<string, unknown> | null;

  @Column({ name: 'position_index', type: 'int' })
  positionIndex!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
