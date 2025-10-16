import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('client_settings')
export class ClientSettingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => ClientEntity)
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;

  @Column({ unique: true })
  clientId: string;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  smsNotifications: boolean;

  @Column({ default: false })
  marketingEmails: boolean;

  @Column({ 
    type: 'enum', 
    enum: ['regular', 'vip', 'new'],
    default: 'regular'
  })
  clientType: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column('json')
  preferences: {
    preferredContactMethod: 'email' | 'sms' | 'phone';
    language: string;
    timezone: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}