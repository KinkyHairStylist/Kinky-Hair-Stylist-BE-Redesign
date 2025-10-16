import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompanySize } from '../types/constants';
import { UserEntity } from './user.entity';

@Entity('businesses')
export class BusinessEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; 

  @Column()
  businessName: string;

  @Column()
  description: string;

  @Column()
  primaryAudience: string;

  @Column('simple-array')
  services: string[];

  @Column()
  businessAddress: string;

  @Column('json')
  bookingPolicies: {
    minimumLeadTime: number;
    bufferTime: number;
    cancellationWindow: number;
    depositAmount: number;
  };

  @Column({ type: 'enum', enum: CompanySize })
  companySize: CompanySize;

  @Column('json')
  bookingHours: Array<{
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    isOpen: boolean;
    startTime: string;
    endTime: string;
  }>;

  @Column()
  howDidYouHear: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}