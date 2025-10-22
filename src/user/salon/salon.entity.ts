// src/salon/salon.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SalonImage } from './salon-image.entity';
import { SalonService } from './salon-service.entity';

@Entity()
export class Salon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  address: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  businessInfo: string;

  @Column({ type: 'text', nullable: true })
  additionalPolicies: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'json', default: {} })
  businessHours: Record<string, string>;

  @Column({ type: 'boolean', default: false })
  isMobile: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  travelFee: number;

  @OneToMany(() => SalonImage, image => image.salon)
  images: SalonImage[];

  @OneToMany(() => SalonService, service => service.salon)
  services: SalonService[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  distance: number;
}
