import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './middlewares/strategies/jwt.strategy';
import { PasswordUtil } from './utils/password.util';
import { OtpService } from './services/otp.service';
import { BusinessService } from './services/business.service';
import { BusinessController } from './controllers/business.controller';

import { User } from '../all_user_entities/user.entity';
import { Business } from './entities/business.entity';
import { RefreshToken } from './entities/refresh.token.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailModule } from '../email/email.module';
import {Appointment} from "./entities/appointment.entity";
import {Staff} from "./entities/staff.entity";
import {BlockedTimeSlot} from "./entities/blocked-time-slot.entity";
import {BookingDay} from "./entities/booking-day.entity";
import {Service} from "./entities/Service.entity";
import {AdvertisementPlan} from "./entities/advertisement-plan.entity";
import {EmergencyContact} from "./entities/emergency-contact.entity";
import {Address} from "./entities/address.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User,EmergencyContact,Address,AdvertisementPlan, Business, RefreshToken, EmailVerification,Appointment,Staff,BlockedTimeSlot,BookingDay,Service]),
    JwtModule.register({}),
    EmailModule,
  ],
  controllers: [AuthController, BusinessController],
  providers: [
    AuthService,
    BusinessService,
    OtpService,
    PasswordUtil,
    JwtStrategy,
  ],
  exports: [AuthService, BusinessService, OtpService],
})
export class BusinessModule {}
