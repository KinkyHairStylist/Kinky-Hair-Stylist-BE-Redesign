import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Staff } from './staff.entity';
import { Business } from './business.entity';

// Informational record only — staff have no wallet/payout of their own yet
// (no working staff login exists). Created once per staff member per
// completed booking so the merchant can see "Jane earned $X this week";
// never moves any money. See Staff.commissionRate.
@Entity('staff_commission_earnings')
export class StaffCommissionEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  staffId: string;

  @ManyToOne(() => Staff, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staffId' })
  staff: Staff;

  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  orderId: string;

  // The net-to-business amount this commission was calculated on (after
  // KHS's own commission/acquisition fee, where those apply — see
  // BusinessService.completeBooking's netAmount).
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  netAmount: number;

  // The rate that was applied, captured at the time — so a later change to
  // Staff.commissionRate doesn't retroactively alter historical rows.
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commissionRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commissionAmount: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
