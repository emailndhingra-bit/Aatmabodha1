import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SvcPersonEntity } from './svc-person.entity';

@Entity({ name: 'svc_sessions' })
export class SvcSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_user_id', type: 'uuid' })
  adminUserId!: string;

  @Column({ type: 'text' })
  label!: string;

  @Column({ type: 'text', nullable: true })
  industry!: string | null;

  @Column({ type: 'text', nullable: true })
  stage!: string | null;

  @Column({ name: 'funding_status', type: 'text', nullable: true })
  fundingStatus!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => SvcPersonEntity, (p) => p.session, { cascade: true })
  people!: SvcPersonEntity[];
}
