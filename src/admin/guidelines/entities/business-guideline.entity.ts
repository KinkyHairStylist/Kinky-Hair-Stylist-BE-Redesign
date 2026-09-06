import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('business_guidelines')
export class BusinessGuidelineEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('jsonb', { default: '[]' })
  items: string[];

  @Column('int', { default: 0 })
  position: number;

  @UpdateDateColumn()
  updatedAt: Date;
}