import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Business } from "./business.entity";

@Entity()
export class Staff {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({
        type: 'enum',
        enum: ['HAIRSTYLIST', 'BARBER', 'NAIL_TECH', 'SPA_THERAPIST', 'MANAGER', 'RECEPTIONIST'],
        default: 'HAIRSTYLIST'
    })
    role: string;

    @Column({ nullable: true })
    specialization: string;

    @Column({ nullable: true })
    experienceYears: number;

    @Column('text', { array: true, nullable: true })
    times: string[];

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Business, (business) => business.staff, { onDelete: "CASCADE" })
    @JoinColumn({ name: "business_id" })
    business: Business;
}
