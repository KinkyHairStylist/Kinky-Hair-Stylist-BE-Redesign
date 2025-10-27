import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Referral } from '../referral/referral.entity';
import { UserMembership } from '../membership/membership.entity';
import { PaymentMethod } from '../payment/payment-method.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  password?: string;

  @Column({ type: 'varchar', nullable: true })
  firstName: string;

  @Column({ type: 'varchar', nullable: true })
  surname: string;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', nullable: true })
  gender: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verificationExpires: Date | null;

  @Column({ type: 'varchar', nullable: true })
  resetCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetCodeExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  // 👇 NEW: Referral fields
  @Column({ nullable: true })
  referralCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingRewards: number;

  @OneToMany(() => Referral, referral => referral.referrer)
  referrals: Referral[];

  @OneToMany(() => Referral, referral => referral.referee)
  referredBy: Referral[];

  // Add to existing User entity
@OneToMany(() => UserMembership, membership => membership.user)
memberships: UserMembership[];

@OneToMany(() => PaymentMethod, paymentMethod => paymentMethod.user)
paymentMethods: PaymentMethod[];
}
