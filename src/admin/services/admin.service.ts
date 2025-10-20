import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';

import {User} from '../../business/entities/user.entity';
import {Business, BusinessStatus} from "../../business/entities/business.entity";
import {BusinessApplication} from "../../business/entities/businessApplication.entity";
import {ApplicationStatus} from "../../business/types/constants";
import {BookingDay} from "../../business/entities/booking-day.entity";
import {Appointment, AppointmentStatus} from "../../business/entities/appointment.entity";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Business) private businessRepo: Repository<Business>,
        @InjectRepository(BusinessApplication) private businessApplicationRepo:Repository<BusinessApplication>,
        @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    ) {
    }

    async getAllUsers() {
        return this.userRepo.find();
    }

    async getAllAppointments(){
        return this.appointmentRepo.find();
    }

    async getAppointmentById(appointmentId: string){
        return this.appointmentRepo.findOne({where: {id: appointmentId}});
    }

    refund(appointment: Appointment){

    }

    async cancelAppointment(appointmentId: string,reason:string){
        const appointment = await this.appointmentRepo.findOne({where: {id: appointmentId}});
        if(!appointment){
            throw new UnauthorizedException('appointment does not exist');
        }
        this.refund(appointment);

        appointment.status = AppointmentStatus.CANCELLED;
        this.appointmentRepo.save(appointment);
        return "done!"
    }


    async getAllBusinesses(){
        return this.businessRepo.find();
    }

    async getAllBusinessApplications(){
        return this.businessApplicationRepo.find();
    }

    async getPendingApplications() {
        return this.businessApplicationRepo.find({
            where: { applicationStatus: ApplicationStatus.PENDING },
        });
    }
    async findApplicationById(id: string) {
        return this.businessApplicationRepo.findOne({ where: { id } });
    }

    async rejectApplication(id: string) {
        const application = await this.businessRepo.findOne({ where: { id } });
        if (!application) {
            throw new UnauthorizedException('Application not found');
        }
        application.status = BusinessStatus.REJECTED;
        return this.businessRepo.save(application);

    }

    async approveApplication(id: string) {
        const application = await this.businessRepo.findOne({ where: { id } });
        if (!application) {
            throw new UnauthorizedException('Application not found');
        }
        application.status = BusinessStatus.APPROVED;
        return this.businessRepo.save(application);

    }

    async findByFirstName(firstName: string) {
        if (firstName.trim() === "") {
            throw new BadRequestException('Name must not be empty');
        }
        return await this.userRepo.find({ where: { firstName } });
    }

    async findBySurname(surname: string) {
        if (surname.trim() === "") {
            throw new BadRequestException('Surname must not be empty');
        }
        return await this.userRepo.find({ where: { surname } });
    }

    async findByEmail(email: string) {
        if (email.trim() === "") {
            throw new BadRequestException('Email must not be empty');
        }
        return await this.userRepo.find({ where: { email } });
    }

    async findById(id: string) {
        if (id.trim() === "") {
            throw new BadRequestException('Id must not be empty');
        }
        return await this.userRepo.findOneById(id);
    }

    async findAllSuspended() {
        return await this.userRepo.find({
            where: { isVerified: true },
        });
    }

    async findAllNotSuspended() {
        return await this.userRepo.find({
            where: { isVerified: false },
        });
    }

    async findByPhoneNumber(phone: string) {

        return await this.userRepo.find({ where :  {phone}})
    }

    async suspend(id: string , reason: string) {
        const user = await this.findById(id)
        if (!user) {
            throw new BadRequestException('User not found');
        }

        user.isSuspended = true;
        user.suspensionHistory += Date.now() + ": reason "+reason;
        await this.userRepo.save(user);

        return { message: `User ${user.email} has been suspended.` };
    }

    async suspendBusiness(id: string) {
        const business = await this.businessRepo.findOne({ where: {id}})
        if (!business) {
            throw new BadRequestException('User not found');
        }

        business.status = BusinessStatus.SUSPENDED;

        await this.businessRepo.save(business);

    }

    async unsuspend(id: string) {
        const user = await this.findById(id)
        if (!user) {
            throw new BadRequestException('User not found');
        }

        user.isSuspended = false;
        await this.userRepo.save(user);

        return { message: `User ${user.email} has been unsuspended.` };
    }


}


