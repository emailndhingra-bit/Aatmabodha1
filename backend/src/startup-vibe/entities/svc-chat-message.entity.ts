import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SvcChatThreadEntity } from './svc-chat-thread.entity';

@Entity({ name: 'svc_chat_messages' })
export class SvcChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'thread_id', type: 'uuid' })
  threadId!: string;

  @ManyToOne(() => SvcChatThreadEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'thread_id' })
  thread!: SvcChatThreadEntity;

  @Column({ type: 'text' })
  role!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'scope_person_ids', type: 'uuid', array: true, nullable: true })
  scopePersonIds!: string[] | null;

  @Column({ name: 'scope_kind', type: 'text', nullable: true })
  scopeKind!: string | null;

  @Column({ name: 'hypothetical_note', type: 'text', nullable: true })
  hypotheticalNote!: string | null;

  @Column({ name: 'tokens_in', type: 'int', nullable: true })
  tokensIn!: number | null;

  @Column({ name: 'tokens_out', type: 'int', nullable: true })
  tokensOut!: number | null;

  @Column({ name: 'cache_hit', type: 'boolean', default: false })
  cacheHit!: boolean;

  @Column({ name: 'generation_ms', type: 'int', nullable: true })
  generationMs!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
