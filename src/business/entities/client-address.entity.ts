import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('client_addresses')
export class ClientAddressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  addressName: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  city: string;

  @Column()
  state: string;

  @Column()
  zipCode: string;

  @Column({ default: 'Australia' })
  country: string;

  @Column({ default: false })
  isPrimary: boolean;

  @ManyToOne(() => ClientEntity, (client) => client.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;

  @Column()
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}