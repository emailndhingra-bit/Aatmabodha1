import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  gender: string;

  @Column()
  dateOfBirth: string;

  @Column()
  timeOfBirth: string;

  @Column({ nullable: true })
  placeOfBirth: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  timezone: string;

  @Column({ default: 0 })
  questionsUsed: number;

  @CreateDateColumn()
  createdAt: Date;
}
