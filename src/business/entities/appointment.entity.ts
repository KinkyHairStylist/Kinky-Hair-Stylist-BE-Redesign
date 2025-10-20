import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Business } from "./business.entity";

export enum AppointmentStatus {
    CONFIRMED = "Confirmed",
    PENDING = "Pending",
    CANCELLED = "Cancelled",
    COMPLETED = "Completed",
}

export enum PaymentStatus {
    PAID = "Paid",
    UNPAID = "Unpaid",
}

@Entity("appointments")
export class Appointment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // 👩 Client (User)
    @ManyToOne(() => User, (user) => user.clientAppointments, {
        eager: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "client_id" })
    client: User;

    // 💼 Business
    @ManyToOne(() => Business, (business) => business.appointments, {
        eager: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "business_id" })
    business: Business;

    // 💇 Appointment details
    @Column()
    serviceName: string;

    @Column()
    date: string; // e.g. "2024-01-15"

    @Column()
    time: string; // e.g. "2:00 PM"

    @Column()
    duration: string; // e.g. "4:00 PM (120 min)"

    @Column({
        type: "enum",
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING,
    })
    status: AppointmentStatus;

    // 💰 Payment details
    @Column({ type: "float", default: 0 })
    amount: number;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.UNPAID,
    })
    paymentStatus: PaymentStatus;

    // ✍️ Optional Notes
    @Column({ type: "text", nullable: true })
    specialRequests?: string;

    // 🕓 Appointment timeline
    @Column({
        type: "jsonb",
        nullable: true,
        default: () => `'[]'`,
    })
    timeline: {
        actor: string;
        action: string;
        timestamp: string;
    }[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
