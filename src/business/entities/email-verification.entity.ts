import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('email_verifications')
export class EmailVerificationEntity {
  @PrimaryColumn()
  email: string;

  @Column()
  otp: string;

  @Column()
  expiresAt: Date;

  @Column({ default: 0 })
  trials: number;

  @Column({ default: 5 })
  maxTrials: number;

  @CreateDateColumn()
  createdAt: Date;
}