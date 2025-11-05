import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ClientSchema } from './client.entity';

@Entity('client_addresses')
@Index(['client'])
export class ClientAddressSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => ClientSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: ClientSchema;

  @Column()
  addressName: string;

  @Column()
  addressLine1: string;

  @Column({ type: 'varchar', nullable: true })
  addressLine2: string | null;

  @Column()
  location: string;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ default: 'Australia' })
  country: string;

  @Column({ default: false })
  isPrimary: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
