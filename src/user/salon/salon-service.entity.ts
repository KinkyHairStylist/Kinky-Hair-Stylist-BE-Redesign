// src/salon/salon-service.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Salon } from './salon.entity';

@Entity()
export class SalonService {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  duration: string;

  @Column({ nullable: true })
  tag: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Salon, salon => salon.services)
  @JoinColumn()
  salon: Salon;

  @Column()
  salonId: number;
}