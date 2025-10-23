import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Gender } from '../types/constants';
import { RefreshToken } from './refresh.token.entity';
import { Business } from './business.entity';
import {Appointment} from "./appointment.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({default: "just now"})
  activity: string;

  @Column({default: 0})
  booking: number;

  @Column({default: 0})
  spent: number

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Appointment, (appointment) => appointment.client,{nullable:true})
  clientAppointments: Appointment[];

  @Column()
  firstName: string;

  @Column({nullable:true})
  longitude: number;

  @Column({nullable:true})
  latitude: number;

  @Column()
  surname: string;

  @Column()
  password: string;

  @Column({ unique: true })
  phone: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isSuspended: boolean;

  @Column({default:"."})
  suspensionHistory: string;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => Business, (business) => business.owner)
  businesses: Business[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
