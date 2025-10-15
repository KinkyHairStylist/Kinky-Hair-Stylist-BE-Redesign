import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('gift_card_templates')
export class GiftCardTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string

  @Column({type: 'text'})
  description: string

  @Column()
  imageUrl: string

  @Column({type: 'decimal', precision: 10, scale: 2, nullable: true})
  fixedAmount: number

  @Column({type: 'jsonb', nullable: true})
  amountOptions: number[]

  @Column()
  colorGradient: string

  @Column({default: true})
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date
}