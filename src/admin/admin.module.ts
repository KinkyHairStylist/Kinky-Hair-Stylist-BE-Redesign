import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { ArticleController } from './controllers/article.controller';
import { AdminService } from './services/admin.service';
import { ArticleService } from './services/article.service';
import { Article } from '../all_user_entities/article.entity';
import {User} from "../all_user_entities/user.entity";
import {Business} from "../business/entities/business.entity";


import {Appointment} from "../business/entities/appointment.entity";
import {Dispute} from "../business/entities/dispute.entity";
import {MembershipPlan} from "../business/entities/membership.entity";
import {Subscription} from "../business/entities/subscription.entity";
import {Payment} from "./payment/entities/payment.entity";
import {EmailService} from "../email/email.service";
import {PaymentService} from "./payment/payment.service";
import { CloudinaryModule } from '../user/modules/cloudinary.module';

@Module({
    imports: [TypeOrmModule.forFeature([User]),
        TypeOrmModule.forFeature([MembershipPlan]),
        TypeOrmModule.forFeature([Business]),
        TypeOrmModule.forFeature([Dispute]),
        TypeOrmModule.forFeature([Appointment]),
        TypeOrmModule.forFeature([Subscription]),
        TypeOrmModule.forFeature([Payment]),
        TypeOrmModule.forFeature([Article]),
        CloudinaryModule,
    ],
    controllers: [AdminController, ArticleController],
    providers: [AdminService,EmailService,PaymentService, ArticleService],
    exports: [AdminService],
})
export class AdminModule {}
