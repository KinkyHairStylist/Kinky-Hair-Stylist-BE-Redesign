import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ClientAddressEntity } from './client-address.entity';
import { ClientSettingsEntity } from './client-settings.entity';
import { EmergencyContactEntity } from './emergency-contact.entity';

@Entity('clients')
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  pronouns: string;

  @Column({ nullable: true })
  occupation: string;

  @Column()
  clientSource: string;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  ownerId: string;

  @Column()
  businessId: string;

  // Relations
  @OneToMany(() => ClientAddressEntity, (address) => address.client)
  addresses: ClientAddressEntity[];

  @OneToOne(() => ClientSettingsEntity, (settings) => settings.client)
  settings: ClientSettingsEntity;

  @OneToMany(() => EmergencyContactEntity, (contact) => contact.client)
  emergencyContacts: EmergencyContactEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}