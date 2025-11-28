import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Business } from './business.entity';
import { Service } from './service.entity';
import { Address } from './address.entity';
import { EmergencyContact } from './emergency-contact.entity';

@Entity()
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

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

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  employmentType: string;

  @Column({ nullable: true })
  startDate: Date;

  @Column('simple-array', { nullable: true })
  servicesAssigned: string[];

  @OneToMany(() => Service, (service) => service.assignedStaff)
  services: Service[];

  @OneToMany(() => Address, (address) => address.staff, {
    cascade: true,
    eager: true,
  })
  addresses: Address[];

  @OneToMany(() => EmergencyContact, (contact) => contact.staff, {
    cascade: true,
    eager: true,
  })
  emergencyContacts: EmergencyContact[];

  @ManyToOne(() => Business, (business) => business.staff, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () => `'{
  "permissions": {
    "viewAppointments": true,
    "editAppointments": true,
    "manageClients": false,
    "viewFinancials": false,
    "manageStaff": false
  },
  "workingHours": { "start": "09:00", "end": "18:00" },
  "workingDays": {
    "Monday": true,
    "Tuesday": true,
    "Wednesday": true,
    "Thursday": true,
    "Friday": true,
    "Saturday": true,
    "Sunday": false
  },
  "notifications": {
    "newBooking": true,
    "dailySummary": true
  },
  "color": "#ef4444"
}'`,
  })
  settings: {
    permissions: {
      viewAppointments: boolean;
      editAppointments: boolean;
      manageClients: boolean;
      viewFinancials: boolean;
      manageStaff: boolean;
    };
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: {
      Monday: boolean;
      Tuesday: boolean;
      Wednesday: boolean;
      Thursday: boolean;
      Friday: boolean;
      Saturday: boolean;
      Sunday: boolean;
    };
    notifications: {
      newBooking: boolean;
      dailySummary: boolean;
    };
    color: string;
  };
}
