import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Business } from './business.entity';
import { Staff } from './staff.entity';
import { AdvertisementPlan } from './advertisement-plan.entity';

@Entity('Service')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  price: number;

  @Column({ nullable: true })
  duration: string;

  @ManyToOne(() => AdvertisementPlan, { eager: true, nullable: true })
  @JoinColumn({ name: 'advertisementPlanId' })
  advertisementPlan: AdvertisementPlan;

  @ManyToOne(() => Business, (business) => business.service, { nullable: true })
  business: Business;

  @ManyToOne(() => Staff, (staff) => staff.services, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  assignedStaff: Staff;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
