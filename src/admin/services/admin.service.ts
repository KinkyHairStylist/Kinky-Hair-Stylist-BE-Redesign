import {Injectable, BadRequestException, Post, Body, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../business/entities/user.entity';
import {Business} from "../../business/entities/business.entity";
import { BusinessApplication } from "../../business/entities/businessApplication.entity";
import {ApplicationStatus} from "../../business/types/constants";
import {Application} from "express";

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Business) private businessRepo: Repository<Business>,
        @InjectRepository(BusinessApplication) private businessApplicationRepo:Repository<BusinessApplication>,
    ) {
    }

    async getAllUsers() {
        return this.userRepo.find();
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
        const application = await this.businessApplicationRepo.findOne({ where: { id } });
        if (!application) {
            throw new UnauthorizedException('Application not found');
        }
        application.applicationStatus = ApplicationStatus.REJECTED;
        return this.businessApplicationRepo.save(application);

    }

    async approveApplication(id: string) {
        const application = await this.businessApplicationRepo.findOne({ where: { id } });
        if (!application) {
            throw new UnauthorizedException('Application not found');
        }
        application.applicationStatus = ApplicationStatus.APPROVED;
        return this.businessApplicationRepo.save(application);

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


