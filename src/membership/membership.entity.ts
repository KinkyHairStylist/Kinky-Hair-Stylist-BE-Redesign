// src/membership/membership.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class MembershipTier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  period: 'monthly' | 'yearly';

  @Column()
  description: string;

  @Column({ type: 'text', array: true })
  features: string[];

  @Column({ default: false })
  isPopular: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserMembership, membership => membership.tier)
  users: UserMembership[];
}

@Entity()
export class UserMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  tierId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monthlyCost: number;

  @Column({ default: 'active' })
  status: 'active' | 'paused' | 'cancelled';

  @Column({ nullable: true })
  nextBillingDate: Date;

  @Column({ default: 0 })
  sessionsUsed: number;

  @Column()
  totalSessions: number;

  @Column({ nullable: true })
  cancelledAt: Date;

  @ManyToOne(() => User, user => user.memberships)
  user: User;

  @ManyToOne(() => MembershipTier, tier => tier.users)
  tier: MembershipTier;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
