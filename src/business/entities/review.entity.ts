import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientType } from './client-settings.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ name: 'client_id' })
  ownerId: string;

  @Column({ name: 'business_id', nullable: true })
  businessId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ type: 'text', nullable: true })
  replyTime: string | null;

  @Column({ type: 'int', default: 0 })
  likes: number;

  // ✅ Also store snapshot client info
  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'text', nullable: true })
  clientProfileImage: string | null; // URL or path

  // ✅ Service being reviewed
  @Column()
  service: string;

  // ✅ client type
  @Column({ type: 'enum', enum: ClientType })
  clientType: ClientType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
