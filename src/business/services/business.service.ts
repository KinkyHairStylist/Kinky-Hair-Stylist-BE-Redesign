import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Not, Repository} from 'typeorm';
import {Business} from '../entities/business.entity';
import {User} from '../../all_user_entities/user.entity';
import {CreateBusinessDto} from '../dtos/requests/CreateBusinessDto';
import {getBusinessServices} from '../data/business.services';
import {BookingPoliciesData, BusinessServiceData} from '../types/constants';
import {getBookingPoliciesConfiguration} from '../data/booking-policies';
import {Appointment, AppointmentStatus, PaymentStatus} from "../entities/appointment.entity";
import {CreateBookingDto} from "../dtos/requests/CreateBookingDto";
import {Staff} from "../entities/staff.entity";
import {EmailService} from "../../email/email.service";

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    private emailService: EmailService,

  ) {}

  /**
   * Creates a new business linked to the authenticated user.
   * @param createBusinessDto The data for the new business.
   * @param owner The user entity of the business owner.
   * @returns The created business entity.
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    owner: User,
  ): Promise<Business> {
    const business = this.businessRepo.create({
      ...createBusinessDto,
      owner,
    });

    business.ownerName = (owner?.firstName + " " + owner?.surname)|| ""
    business.ownerEmail = owner?.email || ""
    business.ownerPhone = owner?.phoneNumber || ""

    return await this.businessRepo.save(business);
  }

  async getBooking(id:string){
    return await this.appointmentRepo.findOne({where: {id}});
  }

  async completeBooking(id:string){
    const appointment = await this.appointmentRepo.findOne({where: {id}});
    if (!appointment) {throw new NotFoundException('Appointment Not Found');}

    appointment.status = AppointmentStatus.COMPLETED
    await this.emailService.sendEmail(appointment.client.email,
        `Appointment with ${appointment.business.businessName} `,
        `your appointment has been completed on ${appointment.date} `,
        ""
        ,)

    appointment.status = AppointmentStatus.COMPLETED
    return await this.appointmentRepo.save(appointment);

  }

  async createBooking(dto: CreateBookingDto, clientId: string): Promise<Appointment> {
    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException("Client user not found");

    const business = await this.businessRepo.findOne({ where: { id: dto.businessId } });
    if (!business) throw new NotFoundException("Business not found");

    let staff: Staff[] = [];
    if (dto.staffIds && dto.staffIds.length > 0) {
      staff = await this.staffRepo.find({
        where: { id: In(dto.staffIds) }
      });

      if (staff.length !== dto.staffIds.length) {
        throw new NotFoundException("One or more staff members not found");
      }
    }

    const appointment = this.appointmentRepo.create({
      client,
      business,
      staff,
      serviceName: dto.serviceName,
      date: dto.date,
      time: dto.time,
      duration: dto.duration,
      amount: dto.amount ?? 0,
      specialRequests: dto.specialRequests ?? undefined,
      status: AppointmentStatus.PENDING,
      paymentStatus: dto.paymentStatus ?? PaymentStatus.UNPAID,
    });

    return await this.appointmentRepo.save(appointment);
  }



  async rescheduleBooking(body:{id:string,reason:string,date:string,time:string}){
    const id = body.id
    const appointment = await this.appointmentRepo.findOne({where: {id}});
    if(!appointment){throw new NotFoundException("Appointment not found")}
    appointment.time = body.time;
    appointment.date = body.date;
    appointment.status = AppointmentStatus.RESCHEDULED;
    return await this.appointmentRepo.save(appointment);

  }



  async rejectBooking(id:string){
    const appointment = await this.appointmentRepo.findOne({where: {id}});
    if(!appointment){throw new NotFoundException("Appointment not found")}
    appointment.status = AppointmentStatus.CANCELLED
    return  this.appointmentRepo.save(appointment);
  }

  async acceptBooking(id:string){
    const appointment = await this.appointmentRepo.findOne({where: {id}});
    if(!appointment){throw new NotFoundException("Appointment not found")}
    appointment.status = AppointmentStatus.CONFIRMED
    return  this.appointmentRepo.save(appointment);
  }

  async getRescheduledBookings(userId:string){

    const business = await this.businessRepo.findOne({
      where: { owner: { id: userId } },
    });

    if (!business) {
      throw new NotFoundException("Business does not exist");
    }

    return await this.appointmentRepo.find({
      where: {
        business: { id: business.id },
        status: (AppointmentStatus.RESCHEDULED),
      },
      relations: ["business", "staff", "client"],
      order: {
        createdAt: "DESC",
      },
    });
  }

  async getBookings(userId: string) {

    const business = await this.businessRepo.findOne({
      where: { owner: { id: userId } },
    });

    if (!business) {
      throw new NotFoundException("Business does not exist");
    }

    return await this.appointmentRepo.find({
      where: {
        business: { id: business.id },
      },
      relations: ["business", "staff", "client"],
      order: {
        createdAt: "DESC",
      },
    });
  }



  getServices(): BusinessServiceData[] {
    return getBusinessServices();
  }

  getBookingPoliciesConfiguration(): BookingPoliciesData[] {
    return getBookingPoliciesConfiguration();
  }
}
