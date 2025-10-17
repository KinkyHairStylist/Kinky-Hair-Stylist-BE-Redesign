import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

import {ApplicationStatus, CompanySize} from '../types/constants';

@Entity()
export class BusinessApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    businessName: string;

    @Column()
    description: string;

    @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Column()
    businessAddress: string;


    @Column({ type: 'enum', enum: CompanySize })
    companySize: CompanySize;

    @CreateDateColumn()
    applicationDate: Date;

    @Column({ type: 'enum', enum: ApplicationStatus })
    applicationStatus: ApplicationStatus;

}
