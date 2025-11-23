import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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

  @Column({ type: 'varchar' })
  reporter: string;

  @Column({ type: 'varchar' })
  reported: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'varchar' })
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
