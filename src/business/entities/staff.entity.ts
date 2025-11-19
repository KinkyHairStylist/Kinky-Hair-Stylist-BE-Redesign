import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Business } from './business.entity';
import { Address } from './address.entity';
import { EmergencyContactSchema } from './emergency-contact.entity';

import { Service } from './service.entity';

@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  dob: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({
    type: 'enum',
    enum: [
      'HAIRSTYLIST',
      'BARBER',
      'NAIL_TECH',
      'SPA_THERAPIST',
      'MANAGER',
      'RECEPTIONIST',
    ],
    default: 'HAIRSTYLIST',
  })
  role: string;

  @Column({ nullable: true })
  specialization: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  experienceYears: number;

  @Column('text', { array: true, nullable: true })
  times: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  employmentType: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column('simple-array', { nullable: true })
  servicesAssigned: string[];

  // @OneToMany(() => Service, (service) => service.assignedStaff)
  // services: Service[];

  @OneToMany(() => Address, (address) => address.staff, { cascade: true })
  addresses: Address[];

  @OneToMany(() => EmergencyContactSchema, (contact) => contact.staff, {
    cascade: true,
  })
  emergencyContacts: EmergencyContactSchema[];

  @ManyToOne(() => Business, (business) => business.staff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
