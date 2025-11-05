import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Not, Repository} from 'typeorm';
import {Business} from '../entities/business.entity';
import {User} from '../../all_user_entities/user.entity';
import {CreateBusinessDto} from '../dtos/requests/CreateBusinessDto';
import {getBusinessServices} from '../data/business.services';
import {BookingPoliciesData, BusinessServiceData} from '../types/constants';
import {getBookingPoliciesConfiguration} from '../data/booking-policies';
import {Appointment, AppointmentStatus} from "../entities/appointment.entity";

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
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
        status: Not(AppointmentStatus.CANCELLED),
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
