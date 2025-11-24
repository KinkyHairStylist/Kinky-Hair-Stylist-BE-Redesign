import {
  Entity,
  BeforeInsert,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type ReportType = 'Review' | 'Profile' | 'Business';
export type ReportSeverity = 'Medium' | 'Low' | 'High';
export type ReportStatus = 'Pending' | 'Approved' | 'Rejected' | 'Under review';

@Entity()
export class FlaggedContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Custom reference column
  @Column({ unique: true })
  ref: string;

  @Column({ type: 'varchar' })
  type: ReportType;

  @Column({ type: 'text' })
  preview: string;

  @Column({ type: 'varchar', nullable: true })
  reporter: string;

  @Column({ type: 'varchar', nullable: true })
  reported: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', nullable: true })
  severity: ReportSeverity;

  @Column({ type: 'varchar', default: 'Pending' })
  status: ReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  generateRef() {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.ref = `PRT-${randomNumber}`;
  }
}
