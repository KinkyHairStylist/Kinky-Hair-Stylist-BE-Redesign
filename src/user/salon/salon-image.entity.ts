import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Salon } from './salon.entity';

@Entity()
export class SalonImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  caption: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => Salon, (salon) => salon.images)
  @JoinColumn()
  salon: Salon;

  @Column()
  salonId: number;
}