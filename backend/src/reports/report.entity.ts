import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  profileName: string;

  @Column()
  reportType: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', length: 500 })
  contentPreview: string;

  @Column()
  language: string;

  @CreateDateColumn()
  createdAt: Date;
}
