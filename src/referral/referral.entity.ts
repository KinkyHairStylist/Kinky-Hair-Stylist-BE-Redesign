// src/referral/referral.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Referral {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referrerId: string; // User who referred

  @Column()
  refereeId: string; // User who was referred

  @Column({ default: 'pending' })
  status: 'pending' | 'completed';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rewardAmount: number;

  @Column({ nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, user => user.referrals)
  referrer: User;

  @ManyToOne(() => User, user => user.referredBy)
  referee: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
