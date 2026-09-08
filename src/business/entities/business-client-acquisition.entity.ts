import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { User } from 'src/all_user_entities/user.entity';

// One row per (business, client) pair, claimed atomically the moment a
// client's first booking with that business is initiated. Existence of a
// row means the acquisition fee has already been applied for this pair —
// see booking.service.ts's atomic INSERT ... ON CONFLICT DO NOTHING claim.
@Entity('business_client_acquisitions')
@Index(['businessId', 'clientId'], { unique: true })
export class BusinessClientAcquisition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessId: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: Business;

  @Column({ nullable: true })
  clientId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;
}
