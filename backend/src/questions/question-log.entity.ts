import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('question_logs')
export class QuestionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userHash: string;

  @Column({ type: 'text', nullable: true })
  questionText: string | null;

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

  // BEHAVIORAL INTELLIGENCE
  /** CAREER|MARRIAGE|HEALTH|WEALTH|PROPERTY|VEHICLE|CHILDREN|TRAVEL|SPIRITUAL|PERSONALITY|TIMING|OTHER */
  @Column({ nullable: true })
  questionCategory: string;

  /** ANXIETY|AMBITION|VALIDATION|CURIOSITY|CRISIS|PLANNING */
  @Column({ nullable: true })
  questionIntent: string;

  /** URGENT|CALM|DESPERATE|HOPEFUL|CONFUSED|NEUTRAL|FEARFUL */
  @Column({ nullable: true })
  emotionalTone: string;

  /** Which Q# in session (1st, 2nd, 3rd...) */
  @Column({ type: 'int', nullable: true })
  sessionDepth: number | null;

  /** Group all Qs in one session together */
  @Column({ nullable: true })
  sessionId: string;

  /** What category was asked BEFORE this Q */
  @Column({ nullable: true })
  prevCategory: string;

  /** How many days since user last asked anything */
  @Column({ type: 'int', nullable: true })
  returnedAfterDays: number | null;

  // ASTROLOGICAL INTELLIGENCE (snapshot at moment of asking)
  /** e.g. "Jupiter-Venus-Rahu" exact dasha when Q asked */
  @Column({ nullable: true })
  dashaAtTime: string;

  /** Moon transit sign at moment of asking */
  @Column({ nullable: true })
  moonSignAtTime: string;

  /** JSON: all planet positions at exact moment */
  @Column({ type: 'text', nullable: true })
  transitsSnapshot: string;

  /** User's natal Moon sign */
  @Column({ nullable: true })
  userMoonSign: string;

  /** User's Lagna */
  @Column({ nullable: true })
  userLagna: string;

  /** Soul planet (Atmakaraka) */
  @Column({ nullable: true })
  userAtmakaraka: string;

  /** Was user in Sade Sati when asking? */
  @Column({ type: 'boolean', nullable: true })
  userSadeSati: boolean | null;

  /** BENEFIC|MALEFIC|NEUTRAL at time of asking */
  @Column({ nullable: true })
  userDashaType: string;

  @Column({ nullable: true })
  ageGroup: string;

  @CreateDateColumn()
  createdAt: Date;
}
