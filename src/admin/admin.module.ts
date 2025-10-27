import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import {User} from "../all_user_entities/user.entity";
import {Business} from "../business/entities/business.entity";

import {BusinessApplication} from "../business/entities/businessApplication.entity";
import {Appointment} from "../business/entities/appointment.entity";
import {Dispute} from "../business/entities/dispute.entity";
import {MembershipPlan} from "../business/entities/membership.entity";
import {Subscription} from "../business/entities/subscription.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([MembershipPlan]),
        TypeOrmModule.forFeature([Business]),
        TypeOrmModule.forFeature([Dispute]),
        TypeOrmModule.forFeature([Appointment]),
        TypeOrmModule.forFeature([BusinessApplication]),
        TypeOrmModule.forFeature([Subscription])
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
