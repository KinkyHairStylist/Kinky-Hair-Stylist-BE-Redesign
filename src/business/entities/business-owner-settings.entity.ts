import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';

// Embedded types for nested objects
export class ReminderRule {
  @Column()
  messageType: string;

  @Column()
  reminderHoursBeforeAppointment: number;

  @Column({ type: 'text' })
  reminderMessage: string;
}

export class BusinessNotifications {
  @Column({ default: false })
  newBookingAlerts: boolean;

  @Column({ default: false })
  cancellationAlerts: boolean;

  @Column({ default: false })
  dailySummaryReports: boolean;
}

export class NotificationSettings {
  @Column({ default: false })
  enableAutomatedReminders: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reminderRules: ReminderRule[];

  @Column(() => BusinessNotifications)
  businessNotifications: BusinessNotifications;
}

export class BookingRules {
  @Column({ type: 'int', default: 24 })
  minimumLeadTimeHours: number;

  @Column({ type: 'int', default: 0 })
  bufferTimeBetweenAppointmentsMinutes: number;

  @Column({ type: 'int', default: 90 })
  maximumAdvanceBookingDays: number;

  @Column({ type: 'varchar', nullable: true })
  sameDayBookingCutoff: string;

  @Column({ default: false })
  enableWaitlist: boolean;

  @Column({ default: false })
  autoNotifyWaitlist: boolean;

  @Column({ default: false })
  allowDoubleBookings: boolean;
}

export class ClientManagement {
  @Column({ type: 'int', default: 3 })
  noShowLimit: number;

  @Column({ type: 'int', default: 30 })
  restrictionPeriodDays: number;

  @Column({ default: false })
  requirePhoneVerification: boolean;

  @Column({ default: true })
  allowGuestBooking: boolean;

  @Column({ default: false })
  collectClientFeedback: boolean;

  @Column({ default: false })
  weeklyNoShowReports: boolean;

  @Column({ default: false })
  clientNoShowPattern: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reportRecipients: string[];
}

@Entity('business_owner_settings')
export class BusinessOwnerSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  ownerId: string;

  @Column({ type: 'uuid' })
  @Index()
  businessId: string;

  @OneToOne(() => Business, (business) => business.giftCards, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column(() => NotificationSettings)
  notifications: NotificationSettings;

  @Column(() => BookingRules)
  bookingRules: BookingRules;

  @Column(() => ClientManagement)
  clientManagement: ClientManagement;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
