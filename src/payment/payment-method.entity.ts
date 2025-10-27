import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  lastFour: string;

  @Column()
  expiryMonth: string;

  @Column()
  expiryYear: string;

  @Column({ select: false }) // Never return full card number
  cardNumber: string;

  @Column({ select: false }) // Never return CVC
  cvc: string;

  @Column({ default: 'visa' })
  cardType: 'visa' | 'mastercard';

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.paymentMethods)
  user: User;
}