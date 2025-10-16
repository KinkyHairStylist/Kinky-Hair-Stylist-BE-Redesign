import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('emergency_contacts')
export class EmergencyContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClientEntity)
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;

  @Column()
  clientId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  relationship: string;

  @Column()
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}