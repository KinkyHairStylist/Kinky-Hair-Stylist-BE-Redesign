import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from "typeorm";
import { Business } from "./business.entity";
import { Service } from "./Service.entity";
import { Address } from "./address.entity";
import { EmergencyContact } from "./emergency-contact.entity";

@Entity()
export class Staff {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    gender: string;

    @Column({ nullable: true })
    dob: string;

    @Column({ nullable: true })
    jobTitle: string;

    @Column({
        type: "enum",
        enum: ["HAIRSTYLIST", "BARBER", "NAIL_TECH", "SPA_THERAPIST", "MANAGER", "RECEPTIONIST"],
        default: "HAIRSTYLIST",
    })
    role: string;

    @Column({ nullable: true })
    specialization: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    experienceYears: number;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    employmentType: string;

    @Column({ nullable: true })
    startDate: Date;


    @Column("simple-array", { nullable: true })
    servicesAssigned: string[];

    @OneToMany(() => Service, (service) => service.assignedStaff)
    services: Service[];

    @OneToMany(() => Address, (address) => address.staff, { cascade: true })
    addresses: Address[];

    @OneToMany(() => EmergencyContact, (contact) => contact.staff, { cascade: true })
    emergencyContacts: EmergencyContact[];

    @ManyToOne(() => Business, (business) => business.staff, { onDelete: "CASCADE" })
    @JoinColumn({ name: "business_id" })
    business: Business;
}
