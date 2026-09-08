import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClientType } from './client.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column()
  ownerId: string;

  @Column({ type: 'uuid', nullable: true })
  businessId: string | null;
  
  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  // Which staff member this review is about — auto-attributed from the
  // appointment's assigned staff at review time. Nullable since older
  // reviews (and reviews of appointments with no staff assigned) predate
  // this column and only ever rated the business as a whole.
  @Column({ type: 'uuid', nullable: true })
  staffId: string | null;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ type: 'text', nullable: true })
  reply: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  replyTime: Date | string | null;

  @Column({ type: 'text', nullable: true })
  replyBy: string | null;

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
