import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BookingPolicies } from './booking-policies.entity';
import { BookingDay } from './booking-day.entity';
import { CompanySize } from '../types/constants';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  primaryAudience: string;

  @Column('text', { array: true, default: [] })
  services: string[];

  @Column()
  businessAddress: string;

  @OneToOne(() => BookingPolicies, (policies) => policies.business, {
    cascade: true,
    eager: true,
  })
  bookingPolicies: BookingPolicies;

  @Column({ type: 'enum', enum: CompanySize })
  companySize: CompanySize;

  @OneToMany(() => BookingDay, (day) => day.business, {
    cascade: true,
    eager: true,
  })
  bookingHours: BookingDay[];

  @Column()
  howDidYouHear: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
