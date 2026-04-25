import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SvcSessionEntity } from './svc-session.entity';
import { SvcResultEntity } from './svc-result.entity';

@Entity({ name: 'svc_chat_threads' })
export class SvcChatThreadEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => SvcSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session!: SvcSessionEntity;

  @Column({ name: 'result_id', type: 'uuid' })
  resultId!: string;

  @ManyToOne(() => SvcResultEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'result_id' })
  result!: SvcResultEntity;

  @Column({ name: 'rules_version', type: 'text' })
  rulesVersion!: string;

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({ name: 'message_count', type: 'int', default: 0 })
  messageCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({
    name: 'last_message_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastMessageAt!: Date;
}
