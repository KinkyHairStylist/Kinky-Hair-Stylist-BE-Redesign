import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity('admins')
export class Admin {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique:true})
    email: string;

    @Column()
    password: string;

    @Column()
    fullName: string;

    @Column({default: false})
    isVerified: boolean;
    
    @Column({ nullable: true })
    otp: string;

    @Column({ nullable: true })
    otpExpiresAt: Date;

    @Column({default: false})
    isSuspended: boolean;
} 