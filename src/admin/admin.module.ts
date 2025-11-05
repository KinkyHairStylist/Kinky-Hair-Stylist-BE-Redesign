import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import {Payment} from "./payment/entities/payment.entity";
import {EmailService} from "../email/email.service";
import {PaymentService} from "./payment/payment.service";
import { EmailValidationMiddleware } from 'src/middleware/email-validation.middleware';
import { Admin } from 'src/all_user_entities/admin.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([MembershipPlan]),
        TypeOrmModule.forFeature([Business]),
        TypeOrmModule.forFeature([Dispute]),
        TypeOrmModule.forFeature([Appointment]),
        TypeOrmModule.forFeature([BusinessApplication]),
        TypeOrmModule.forFeature([Subscription]),
        TypeOrmModule.forFeature([Payment]),
        TypeOrmModule.forFeature([Admin]),
    ],
    controllers: [AdminController],
    providers: [AdminService,EmailService,PaymentService],
    exports: [AdminService],
})
export class AdminModule implements NestModule{
    configure(consumer: MiddlewareConsumer) {
        consumer
        .apply(EmailValidationMiddleware)
        .forRoutes({
            path: 'admin/register',
            method: (require('http').METHODS.includes('POST')? 'POST': 'POST') as any
        }, 
       {
        path: 'admin/resend-verification',
        method: (require('http').METHODS.includes('POST')? 'POST': 'POST') as any
       },
       {
        path: 'admin/verify-email',
        method: (require('http').METHODS.includes('POST')? 'POST': 'POST') as any
       },
    );
    }
}
