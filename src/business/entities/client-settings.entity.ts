import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClientSchema } from './client.entity';

export enum ClientType {
  REGULAR = 'regular',
  VIP = 'vip',
  NEW = 'new',
  ALL = 'all',
}

export enum PreferredContactMethod {
  EMAIL = 'email',
  SMS = 'sms',
  PHONE = 'phone',
}

@Entity('client_settings')
@Index(['clientType'])
export class ClientSettingsSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id' })
  clientId: string;

  @OneToOne(() => ClientSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client: ClientSchema;

  @Column({ default: true })
  emailNotifications: boolean;

  @Column({ default: true })
  smsNotifications: boolean;

  @Column({ default: false })
  marketingEmails: boolean;

  @Column({
    type: 'enum',
    enum: ClientType,
    default: ClientType.REGULAR,
  })
  clientType: ClientType;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'jsonb',
    default: {
      preferredContactMethod: 'email',
      language: 'en',
      timezone: 'Australia/Sydney',
    },
  })
  preferences: {
    preferredContactMethod: PreferredContactMethod;
    language: string;
    timezone: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
