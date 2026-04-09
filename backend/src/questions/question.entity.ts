import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('question_logs')
export class QuestionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userHash: string;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  responsePreview: string;

  @Column({ default: 0 })
  inputTokens: number;

  @Column({ default: 0 })
  outputTokens: number;

  @Column({ type: 'float', default: 0 })
  costUsd: number;

  @Column({ nullable: true })
  language: string;

  @Column({ default: false })
  cacheHit: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
