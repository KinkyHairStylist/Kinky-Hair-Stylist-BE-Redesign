import {BadRequestException, Injectable, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {EmailService} from "../../email/email.service";
import {User} from "../../all_user_entities/user.entity";
import {Business, BusinessStatus} from "../../business/entities/business.entity";
import {BusinessApplication} from "../../business/entities/businessApplication.entity";
import {ApplicationStatus} from "../../business/types/constants";
import {Appointment, AppointmentStatus} from "../../business/entities/appointment.entity";
import {Dispute, DisputeStatus} from "../../business/entities/dispute.entity";
import {CreateMembershipPlanDto} from "../../business/dtos/requests/CreateMembershipDto";
import {MembershipPlan} from "../../business/entities/membership.entity";
import {GetMembershipPlanDto} from "../../business/dtos/response/GetMembershipPlanDto";
import {GetSubscriptionDto} from "../../business/dtos/response/GetSubscriptionDto";
import {Status, Subscription} from "../../business/entities/subscription.entity";
import {PaymentService} from "../payment/payment.service";
import {Payment} from "../payment/entities/payment.entity";
import { Admin } from "../../all_user_entities/admin.entity";
import { RegisterAdminDto } from "../dtos/register-admin.dtos";
import { PasswordHashing } from '../helper/password-hashing';           
import { generateOtp, otpExpiry } from '../utils/otp.util';
import { sendEmail } from '../utils/email.service';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Business) private businessRepo: Repository<Business>,
        @InjectRepository(BusinessApplication) private businessApplicationRepo:Repository<BusinessApplication>,
        @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
        @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
        @InjectRepository(MembershipPlan) private membershipPlanRepo: Repository<MembershipPlan>,
        @InjectRepository(Subscription) private subscriptionRepo: Repository<Subscription>,
         @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
        private emailService: EmailService,
        private paymentService: PaymentService,
        @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    ) {

    }

    async getAllUsers() {
        return this.userRepo.find();
    }
    

    async createMembershipPlan(createMembershipPlanDto: CreateMembershipPlanDto) {
        const plan = this.membershipPlanRepo.create(createMembershipPlanDto);
        return await this.membershipPlanRepo.save(plan);
    }

    async updateMembershipPlan(
        id: string,
        createMembershipPlanDto: CreateMembershipPlanDto,
    ) {
        const plan = await this.membershipPlanRepo.findOne({ where: { id } });

        if (!plan) {
            throw new Error('Membership plan not found');
        }


        Object.assign(plan, createMembershipPlanDto);

        return await this.membershipPlanRepo.save(plan);
    }

    async removeMembershipPlan(id: string,reason: string) {
        const plan = await this.membershipPlanRepo.findOne({ where: { id } });
        if (!plan) {
            throw new Error('Membership plan not found');
        }
        plan.isActive = false;
        if (plan.cancellation==null)plan.cancellation=""
        plan.cancellation+=Date.now() + reason;
        return this.membershipPlanRepo.save(plan);
    }


    async getAllMembershipPlans(): Promise<GetMembershipPlanDto[]> {
        const plans = await this.membershipPlanRepo.find({where:{isActive:true}});

        return plans.map(plan => ({
            id:plan.id,
            name: plan.name,
            tier: plan.tier,
            price: Number(plan.price),
            saving: plan.saving,
            sessions: plan.sessions,
            features: plan.features,
            isPopular: plan.isPopular,
            activeSubscribers: plan.activeSubscribers,
        }));
    }

    async cancelSubscription (id: string) {
        const subscription = await this.subscriptionRepo.findOne({where:{id}});
        if (!subscription) {
            throw new Error('Subscription plan not found');
        }
        subscription.status = Status.CANCELLED
        return await this.subscriptionRepo.save(subscription);
    }

    async getAllSubscribers(): Promise<GetSubscriptionDto[]>{
        const subscriptions = await this.subscriptionRepo.find();

        return subscriptions.map(subscription =>({

            id: subscription.id,
            user:subscription.user.firstName +" "+ subscription.user.surname,
            plan: subscription.plan.name,
            startDate: subscription.startDate.toLocaleDateString(),
            nextBilling: subscription.nextBilling.toLocaleDateString(),
            amount: subscription.plan.price,
            status: subscription.status,

        }));

    }

    async getAllAppointments(){
        return this.appointmentRepo.find();
    }

    async getAppointmentById(appointmentId: string){
        return this.appointmentRepo.findOne({where: {id: appointmentId}});
    }

    async rescheduleAppointment(body){
        const appointment = await this.appointmentRepo.findOne({
            where: { id: body.id },
            relations: ["client", "business"],
        });
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        appointment.date = body.date;
        appointment.time = body.time;

        await this.emailService.sendEmail(appointment.client.email,
            `Appointment with ${appointment.business.businessName} `,
            `your appointment has been rescheduled to ${appointment.date} at ${appointment.time}`,
            ""
            ,)
        return  this.appointmentRepo.save(appointment);
    }

    async cancelAppointment(appointmentId: string,reason:string){
        const appointment = await this.appointmentRepo.findOne({where: {id: appointmentId}});
        if(!appointment){
            throw new UnauthorizedException('appointment does not exist');
        }

        const payment = await this.paymentRepo.findOne({ where: { appointmentId } });
        if (!payment) {
            throw new Error("payment not found")
        }

        const refundObject = {
            transactionId: payment.gatewayTransactionId,
            amount: payment.amount,
            refundType: "Appointment Cancellation",
            reason: reason,
        }

        await this.paymentService.refund(refundObject);

        appointment.status = AppointmentStatus.CANCELLED;
        this.appointmentRepo.save(appointment);
        return "done!"
    }


    async getAllBusinesses(){
        return this.businessRepo.find();
    }

    async resolveDispute(id:string,resolutionNote:string){
        const dispute = await this.disputeRepo.findOne({where: {id: id}});
        if(!dispute){
            throw new UnauthorizedException('dispute does not exist');
        }
        dispute.status = DisputeStatus.RESOLVED;
        dispute.resolutionNotes = resolutionNote;
        return this.disputeRepo.save(dispute);

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

        return await this.userRepo.find({ where :  {phoneNumber: phone} });
    }

    async suspend(id: string , reason: string) {
        const user = await this.findById(id)
        if (!user) {
            throw new BadRequestException('User not found');
        }

        user.isSuspended = true;
        user.isVerified =false;
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
        user.isVerified = true;
        await this.userRepo.save(user);

        return { message: `User ${user.email} has been unsuspended.` };
    }

    //Admin Registration
   async registerAdmin (dto: RegisterAdminDto){
    const existing = await this.adminRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new BadRequestException ('Email already registered');

    if (!dto.password || dto.password.length < 6) throw new BadRequestException ('Password must be at least 6 characters long');

    const hashed = await PasswordHashing.hashPassword(dto.password);
    const otp = generateOtp();
    const admin = this.adminRepo.create({
        email: dto.email,
        password: hashed,
        fullName: dto.fullName || "",
        otp,
        otpExpiresAt: otpExpiry(),
        isVerified: false,
    });
    
    await this.adminRepo.save(admin);
    await this.emailService.sendEmail(dto.email,
        'Verify your Admin account',
    `Your OTP code is ${otp}`
    );
    return { message: `Registration successful. OTP sent to ${dto.email}` };
    }
 
    //Resend OTP
    async resendOtp (email: string) {
        const admin = await this.adminRepo.findOne({ where: { email } });
        if (!admin) throw new BadRequestException ('Admin not found');
        if (admin.isVerified) throw new BadRequestException('Admin already verified')
        const otp = generateOtp();
        admin.otp = otp;
        admin.otpExpiresAt = otpExpiry();
        await this.adminRepo.save(admin);
        await this.emailService.sendEmail(email,
            'Verify your Admin account',
        `Your OTP code is ${otp}`);
        return { message: `New verification OTP sent to ${email}` };
    }
    
    //Verify OTP
    async verifyEmail(body: {email: string, otp: string}){
        const admin = await this.adminRepo.findOne({ where: { email: body.email } });
        if (!admin) throw new BadRequestException ('Admin not found');
        if (admin.isVerified) throw new BadRequestException('Admin already verified')
        if (!admin.otp || admin.otp !== body.otp) throw new BadRequestException('Invalid OTP')
        if (!admin.otpExpiresAt || admin.otpExpiresAt.getTime() < new Date().getTime() )
             throw new BadRequestException('OTP expired')
        admin.isVerified = true;
        admin.otp = "";
        admin.otpExpiresAt = new Date();
        await this.adminRepo.save(admin);
        return { message: `Admin ${admin.email} verified successfully` };
    }
        
}

