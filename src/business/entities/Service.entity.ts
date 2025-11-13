
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn,
} from 'typeorm';
import {Business} from "./business.entity";
import {Staff} from "./staff.entity";
import {AdvertisementPlan} from "./advertisment-plan.entity";

@Entity('Service')
export class Service {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({nullable: true})
    category: string;

    @Column()
    description: string;

    @Column()
    price: number;

    @Column()
    duration: string;

    @ManyToOne(() => AdvertisementPlan, { eager: true,nullable: true })
    @JoinColumn({ name: 'advertisementPlanId' })
    advertisementPlan: AdvertisementPlan;


    @ManyToOne(() => Business, (business) => business.service)
    business: Business;

    @ManyToOne(() => Staff, (staff) => staff.services, {
        onDelete: "SET NULL",
        nullable: true,
        eager: true
    })
    assignedStaff: Staff;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
