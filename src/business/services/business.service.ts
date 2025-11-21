import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin, In, Not, Repository } from 'typeorm';
import { Business } from '../entities/business.entity';
import { User } from '../../all_user_entities/user.entity';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';
import { getBusinessServices } from '../data/business.services';
import { BookingPoliciesData, BusinessServiceData } from '../types/constants';
import { getBookingPoliciesConfiguration } from '../data/booking-policies';
import {
  Appointment,
  AppointmentStatus,
  PaymentStatus,
} from '../entities/appointment.entity';
import { CreateBookingDto } from '../dtos/requests/CreateBookingDto';
import { Staff } from '../entities/staff.entity';
import { EmailService } from '../../email/email.service';
import { BookingDay } from '../entities/booking-day.entity';
import { BlockedTimeSlot } from '../entities/blocked-time-slot.entity';
import { CreateBlockedTimeDto } from '../dtos/requests/CreateBlockedTimeDto';
import { CreateServiceDto } from '../dtos/requests/CreateServiceDto';
import { Service } from '../entities/service.entity';
import { AdvertisementPlan } from '../entities/advertisement-plan.entity';
import { CreateStaffDto } from '../dtos/requests/AddStaffDto';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { Address } from '../entities/address.entity';
import { EditStaffDto } from '../dtos/requests/EditStaffDto';
import { GoogleCalendarService } from 'src/integration/services/google-calendar.service';
import { WalletCurrency } from 'src/admin/payment/enums/wallet.enum';
import { BusinessWalletService } from './wallet.service';

@Injectable()
export class BusinessService {
  constructor(
    @InjectRepository(BookingDay)
    private readonly bookingDayRepo: Repository<BookingDay>,
    @InjectRepository(BlockedTimeSlot)
    private readonly blockedSlotRepo: Repository<BlockedTimeSlot>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Staff)
    private staffRepo: Repository<Staff>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
    @InjectRepository(AdvertisementPlan)
    private advertisementPlanRepo: Repository<AdvertisementPlan>,

    @InjectRepository(EmergencyContact)
    private emergencyRepo: Repository<EmergencyContact>,

    @InjectRepository(Address)
    private addressRepo: Repository<Address>,

    private googleCalendarService: GoogleCalendarService,
    private emailService: EmailService,
    private readonly walletService: BusinessWalletService,
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

    business.ownerName = owner?.firstName + ' ' + owner?.surname || '';
    business.ownerEmail = owner?.email || '';
    business.ownerPhone = owner?.phoneNumber || '';

    await this.businessRepo.save(business);

    // Automatically create wallet
    await this.walletService.createWalletForBusiness({
      businessId: business.id,
      ownerId: owner.id,
      currency: WalletCurrency.AUD,
    });

    return business;
  }

  async getBooking(id: string) {
    return await this.appointmentRepo.findOne({ where: { id } });
  }

  async completeBooking(id: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Appointment Not Found');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    await this.emailService.sendEmail(
      appointment.client.email,
      `Appointment with ${appointment.business.businessName} `,
      `your appointment has been completed on ${appointment.date} `,
      '',
    );

    appointment.status = AppointmentStatus.COMPLETED;

    await this.appointmentRepo.save(appointment);

    //     // Update Google Calendar event
    if (appointment.googleEventId) {
      try {
        await this.googleCalendarService.updateCalendarEvent(
          id,
          appointment.googleEventId,
        );
      } catch (error) {
        console.error('Failed to update Google Calendar:', error);
      }
    }

    return appointment;
  }

  async createBooking(
    dto: CreateBookingDto,
    clientId: string,
  ): Promise<Appointment> {
    const client = await this.userRepo.findOne({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client user not found');

    const business = await this.businessRepo.findOne({
      where: { id: dto.businessId },
    });
    if (!business) throw new NotFoundException('Business not found');

    let staff: Staff[] = [];
    if (dto.staffIds && dto.staffIds.length > 0) {
      staff = await this.staffRepo.find({
        where: { id: In(dto.staffIds) },
      });

      if (staff.length !== dto.staffIds.length) {
        throw new NotFoundException('One or more staff members not found');
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

    await this.appointmentRepo.save(appointment);

    // Sync to Google Calendar
    try {
      const eventId = await this.googleCalendarService.createCalendarEvent(
        appointment.id,
      );
      appointment.googleEventId = eventId;
      await this.appointmentRepo.save(appointment);
    } catch (error) {
      console.error('Failed to sync to Google Calendar:', error);
      // Don't fail the appointment creation if calendar sync fails
    }

    return appointment;
  }

  async getAvailableSlotsForDate(userMail: string, date: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
    });
    if (!business) {
      throw new NotFoundException('Business id not found');
    }
    const businessId = business.id;

    const dayName = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
    }) as BookingDay['day'];

    const bookingDay = await this.bookingDayRepo.findOne({
      where: { business: { id: businessId }, day: dayName },
    });

    if (!bookingDay || !bookingDay.isOpen) return [];

    const appointments = await this.appointmentRepo.find({
      where: { date, business: { id: businessId } },
    });

    const blockedSlots = await this.blockedSlotRepo.find({
      where: { date, business: { id: businessId } },
    });

    return this.getAvailableSlots(bookingDay, appointments, blockedSlots);
  }

  isSlotBlocked(
    slot: string,
    blockedSlots: BlockedTimeSlot[],
    intervalMinutes = 30,
  ): boolean {
    const [slotHours, slotMinutes] = slot.split(':').map(Number);
    const slotStart = slotHours * 60 + slotMinutes;
    const slotEnd = slotStart + intervalMinutes;

    return blockedSlots.some((blocked) => {
      const [blockedStartH, blockedStartM] = blocked.startTime
        .split(':')
        .map(Number);
      const [blockedEndH, blockedEndM] = blocked.endTime.split(':').map(Number);

      const blockedStart = blockedStartH * 60 + blockedStartM;
      const blockedEnd = blockedEndH * 60 + blockedEndM;

      // overlap condition
      return slotStart < blockedEnd && slotEnd > blockedStart;
    });
  }

  async generateSlotsBetween(
    startTime: string,
    endTime: string,
    intervalMinutes = 60,
    serviceDurationMinutes = intervalMinutes,
  ): Promise<string[]> {
    const parseToMinutes = (time: string): number => {
      if (!time) throw new Error('Time value is missing');

      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        time = time.slice(0, 5);
      }

      if (!/^\d{1,2}:\d{2}$/.test(time)) {
        throw new Error(`Invalid time format: ${time}. Expected "HH:mm".`);
      }

      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const toHHMM = (minutes: number) => {
      const hh = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const mm = (minutes % 60).toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };

    const start = parseToMinutes(startTime);
    const end = parseToMinutes(endTime);

    if (start >= end) return [];
    if (intervalMinutes <= 0) throw new Error('intervalMinutes must be > 0');
    if (serviceDurationMinutes <= 0)
      throw new Error('serviceDurationMinutes must be > 0');

    const slots: string[] = [];
    let current = start;

    while (current + serviceDurationMinutes <= end) {
      slots.push(toHHMM(current));
      current += intervalMinutes;
    }

    return slots;
  }

  async editBlockedTime(id: string, dto: CreateBlockedTimeDto) {
    const slot = await this.blockedSlotRepo.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException('Blocked slot not found');
    }
    slot.date = dto.date;
    slot.title = dto.title;
    slot.startTime = dto.startTime;
    slot.endTime = dto.endTime;
    slot.teamMember = dto.teamMember;
    slot.type = dto.type;
    slot.description = dto.description;

    return this.blockedSlotRepo.save(slot);
  }

  async addStaff(
    userMail: string,
    createStaffDto: CreateStaffDto,
  ): Promise<Staff> {
    const { addresses, emergencyContacts, selectedServices, ...staffData } =
      createStaffDto;

    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
    });
    if (!business) {
      throw new Error('Business not found');
    }

    const staff = this.staffRepo.create({ ...staffData, business });

    await this.staffRepo.save(staff);

    if (addresses?.length) {
      const addressEntities = addresses.map((addr) =>
        this.addressRepo.create({ ...addr, staff }),
      );
      await this.addressRepo.save(addressEntities);
      staff.addresses = addressEntities;
    }

    if (emergencyContacts?.length) {
      const contactEntities = emergencyContacts.map((contact) =>
        this.emergencyRepo.create({ ...contact, staff }),
      );
      await this.emergencyRepo.save(contactEntities);
      staff.emergencyContacts = contactEntities;
    }

    if (selectedServices?.length) {
      staff.services = await this.serviceRepo.findByIds(selectedServices);
      await this.staffRepo.save(staff);
    }

    await this.emailService.sendEmail(
      createStaffDto.email,
      `You have been added to ${business.businessName}`,
      `Hello ${createStaffDto.firstName},\n\nYou have been added as a staff member at ${business.businessName}.`,
    );

    return staff;
  }

  async editStaff(staffId: string, editStaffDto: EditStaffDto): Promise<Staff> {
    const staff = await this.staffRepo.findOne({
      where: { id: staffId },
      relations: ['addresses', 'emergencyContacts', 'services'],
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    Object.assign(staff, editStaffDto);

    if (editStaffDto.addresses) {
      await this.addressRepo.delete({ staff: { id: staff.id } });

      const newAddresses = editStaffDto.addresses.map((addr) =>
        this.addressRepo.create({ ...addr, staff }),
      );
      await this.addressRepo.save(newAddresses);
      staff.addresses = newAddresses;
    }

    // Update emergency contacts if provided
    if (editStaffDto.emergencyContacts) {
      await this.emergencyRepo.delete({ staff: { id: staff.id } });

      const newContacts = editStaffDto.emergencyContacts.map((contact) =>
        this.emergencyRepo.create({ ...contact, staff }),
      );
      await this.emergencyRepo.save(newContacts);
      staff.emergencyContacts = newContacts;
    }

    // Update services if provided
    if (editStaffDto.servicesAssigned) {
      const services = await this.serviceRepo.findByIds(
        editStaffDto.servicesAssigned,
      );
      staff.services = services;
    }

    await this.staffRepo.save(staff);
    return staff;
  }

  async createBlockedTime(body: CreateBlockedTimeDto) {
    const business = await this.businessRepo.findOne({
      where: { ownerEmail: body.ownerMail },
    });
    if (!business) throw new NotFoundException('Business not found');

    const blockedSlot = this.blockedSlotRepo.create({
      business,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      type: body.type,
      title: body.title,
      teamMember: body.teamMember,
      description: body.description,
    });

    return await this.blockedSlotRepo.save(blockedSlot);
  }

  async deleteBlockedSlot(slotId: string) {
    await this.blockedSlotRepo.delete({ id: slotId });
    return { message: 'Blocked time deleted successfully' };
  }

  async getBlockedSlots(userMail: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
    });
    if (!business) throw new NotFoundException('Business not found');

    const blockedSlots = await this.blockedSlotRepo.find({
      where: { business: { id: business.id } },
    });

    return blockedSlots;
  }

  getWeekdayFromString(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  async rescheduleBooking(body: {
    id: string;
    reason: string;
    date: string;
    time: string;
  }) {
    const { id, date, time } = body;

    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['business'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const dayName = this.getWeekdayFromString(body.date) as BookingDay['day'];

    const bookingDay = await this.bookingDayRepo.findOne({
      where: { business: { id: appointment.business.id }, day: dayName },
    });
    if (!bookingDay)
      throw new BadRequestException(`No booking schedule for ${dayName}`);
    if (!bookingDay.isOpen)
      throw new BadRequestException(`Business is closed on ${dayName}`);

    const appointments = await this.appointmentRepo.find({
      where: { date, business: { id: appointment.business.id } },
    });
    const blockedSlots = await this.blockedSlotRepo.find({
      where: {
        date: body.date,
        business: { id: appointment.business.id },
      },
    });

    const availableSlots = await this.getAvailableSlots(
      bookingDay,
      appointments,
      blockedSlots,
    );

    if (!availableSlots.includes(time)) {
      throw new BadRequestException(
        `The time ${time} on ${date} is not available.`,
      );
    }

    appointment.time = time;
    appointment.date = date;
    appointment.status = AppointmentStatus.RESCHEDULED;

    await this.appointmentRepo.save(appointment);

    //     // Update Google Calendar event
    if (appointment.googleEventId) {
      try {
        await this.googleCalendarService.updateCalendarEvent(
          id,
          appointment.googleEventId,
        );
      } catch (error) {
        console.error('Failed to update Google Calendar:', error);
      }
    }

    return appointment;
  }

  async getAvailableSlots(bookingDay, appointments, blockedSlots) {
    const slots = await this.generateSlotsBetween(
      bookingDay.startTime,
      bookingDay.endTime,
      30,
    );

    const bookedTimes = appointments.map((a) => a.time);

    return slots.filter(
      (time) =>
        !bookedTimes.includes(time) && !this.isSlotBlocked(time, blockedSlots),
    );
  }

  async rejectBooking(id: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    appointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentRepo.save(appointment);

    //     // Update Google Calendar event
    if (appointment.googleEventId) {
      try {
        await this.googleCalendarService.updateCalendarEvent(
          id,
          appointment.googleEventId,
        );
      } catch (error) {
        console.error('Failed to update Google Calendar:', error);
      }
    }

    return appointment;
  }

  async acceptBooking(id: string) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    appointment.status = AppointmentStatus.CONFIRMED;
    await this.appointmentRepo.save(appointment);

    //     // Update Google Calendar event
    if (appointment.googleEventId) {
      try {
        await this.googleCalendarService.updateCalendarEvent(
          id,
          appointment.googleEventId,
        );
      } catch (error) {
        console.error('Failed to update Google Calendar:', error);
      }
    }

    return appointment;
  }

  async getBusinessServices(userMail: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
      relations: ['service'],
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return business.service;
  }

  async getTeamMembers(userMail: string) {
    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.staffRepo.find({
      where: {
        business: { id: business.id },
        isActive: true,
      },
      relations: ['business'],
    });
  }

  async getAdvertisementPlans() {
    return this.advertisementPlanRepo.find();
  }

  async createService(createServiceDto: CreateServiceDto) {
    const {
      userMail,
      category,
      images,
      advertisementPlanId,
      assignedStaffId,
      name,
      description,
      price,
      duration,
    } = createServiceDto;

    const business = await this.businessRepo.findOne({
      where: { ownerEmail: userMail },
    });
    if (!business) throw new Error('Business not found');

    let advertisementPlan: AdvertisementPlan | undefined;
    if (advertisementPlanId) {
      const foundPlan = await this.advertisementPlanRepo.findOne({
        where: { id: advertisementPlanId },
      });
      if (!foundPlan) throw new Error('Advertisement plan not found');
      advertisementPlan = foundPlan;
    }

    let staff: Staff | undefined;
    if (assignedStaffId) {
      const foundStaff = await this.staffRepo.findOne({
        where: { id: assignedStaffId },
      });
      if (!foundStaff) throw new Error('Staff not found');
      staff = foundStaff;
    }

    const service = this.serviceRepo.create({
      name,
      description,
      price,
      duration,
      business,
      category,
      images,
      advertisementPlan,
      assignedStaff: staff,
    });

    return this.serviceRepo.save(service);
  }

  async deactivateStaff(id: string) {
    const staff = await this.staffRepo.findOne({ where: { id: id } });
    if (!staff) throw new Error('Staff not found');
    staff.isActive = false;
    return this.staffRepo.save(staff);
  }

  async getRescheduledBookings(userId: string) {
    const business = await this.businessRepo.findOne({
      where: { owner: { id: userId } },
    });

    if (!business) {
      throw new NotFoundException('Business does not exist');
    }

    return await this.appointmentRepo.find({
      where: {
        business: { id: business.id },
        status: AppointmentStatus.RESCHEDULED,
      },
      relations: ['business', 'staff', 'client'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getBookings(userId: string) {
    const business = await this.businessRepo.findOne({
      where: { owner: { id: userId } },
    });

    if (!business) {
      throw new NotFoundException('Business does not exist');
    }

    return await this.appointmentRepo.find({
      where: {
        business: { id: business.id },
      },
      relations: ['business', 'staff', 'client'],
      order: {
        createdAt: 'DESC',
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
