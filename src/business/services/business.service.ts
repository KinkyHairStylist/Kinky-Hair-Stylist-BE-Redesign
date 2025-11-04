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

  async getAvailableSlots(businessId: string, dateStr: string) {
    // 1. validate business
    const business = await this.businessRepo.findOne({ where: { id: businessId }, relations: ['bookingHours'] });
    if (!business) throw new NotFoundException('Business not found');

    // 2. derive day name from date string
    const dayName = this._getDayNameFromDateString(dateStr); // e.g. "Monday"

    // 3. fetch booking day (business working hours) for that day
    const bookingDay = business.bookingHours?.find((d) => d.day === dayName);
    if (!bookingDay || bookingDay.isOpen === false) {
      // business closed that day -> no slots
      return [];
    }

    // 4. convert booking open range to minutes
    const businessStartMin = this._timeStrHHMMToMinutes(bookingDay.startTime); // "09:00" => 540
    const businessEndMin = this._timeStrHHMMToMinutes(bookingDay.endTime);

    // 5. fetch appointments for business on that date (exclude cancelled)
    // NOTE: using find with nested relation; adjust if your TypeORM setup differs.
    const appointments = await this.appointmentRepo.find({
      where: {
        business: { id: businessId } as any,
        date: dateStr,
      },
    });

    const busyIntervals: [number, number][] = [];

    for (const appt of appointments) {
      // filter cancelled
      if (appt.status === AppointmentStatus.CANCELLED ) continue;

      // parse appt time like "2:00PM" or "2:00 PM" (case-insensitive)
      const startMin = this._parseAppointmentTimeToMinutes(appt.time);
      if (startMin === null) continue; // ignore invalid times

      // parse duration like "100mins" or "100 min"
      const dur = parseInt(String(appt.duration).replace(/\D/g, ''), 10) || 0;
      const endMin = startMin + dur;

      // clip to business hours
      const clippedStart = Math.max(startMin, businessStartMin);
      const clippedEnd = Math.min(endMin, businessEndMin);
      if (clippedEnd > clippedStart) busyIntervals.push([clippedStart, clippedEnd]);
    }

    // 6. merge busy intervals
    const mergedBusy = this._mergeIntervals(busyIntervals);

    // 7. compute free intervals (gaps) inside [businessStartMin, businessEndMin]
    const freeIntervals: [number, number][] = [];
    let cursor = businessStartMin;

    if (mergedBusy.length === 0) {
      freeIntervals.push([businessStartMin, businessEndMin]);
    } else {
      for (const [bStart, bEnd] of mergedBusy) {
        if (bStart > cursor) {
          freeIntervals.push([cursor, bStart]);
        }
        cursor = Math.max(cursor, bEnd);
      }
      if (cursor < businessEndMin) {
        freeIntervals.push([cursor, businessEndMin]);
      }
    }

    // 8. filter slots by minimum 30 minutes and format into requested object structure (12-hr)
    const MIN_SLOT = 30;
    const formattedSlots = freeIntervals
        .filter(([s, e]) => e - s >= MIN_SLOT)
        .map(([s, e]) => ({
          startTime: this._minutesTo12hString(s), // e.g. "2:00PM"
          stopTime: this._minutesTo12hString(e),
        }));

    return formattedSlots;
  }

  // ---------- Helpers ----------

  // Map date string "YYYY-MM-DD" -> day name: "Sunday", "Monday", ...
  private _getDayNameFromDateString(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00'); // local date
    const dayIndex = d.getUTCDay ? d.getUTCDay() : d.getDay(); // 0=Sun
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[dayIndex];
  }

  // "HH:MM" (24h) -> minutes since midnight
  private _timeStrHHMMToMinutes(t: string): number {
    const [hh, mm] = (t || '00:00').split(':').map((n) => parseInt(n, 10));
    return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
  }

  // Parse "2:00PM" or "2:00 PM" or "02:00PM" -> minutes (0-1439). returns null if invalid
  private _parseAppointmentTimeToMinutes(timeStr?: string): number | null {
    if (!timeStr) return null;
    const cleaned = timeStr.replace(/\s+/g, ''); // remove spaces
    // match H:MMAM/PM or HH:MMAM/PM
    const re = /^(\d{1,2}):(\d{2})(AM|PM)$/i;
    const m = re.exec(cleaned);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const meridian = m[3].toUpperCase();
    if (meridian === 'AM' && hour === 12) hour = 0;
    if (meridian === 'PM' && hour !== 12) hour += 12;
    return hour * 60 + min;
  }

  // Merge overlapping intervals (in minutes); input as array of [start, end]
  private _mergeIntervals(intervals: [number, number][]): [number, number][] {
    if (!intervals.length) return [];
    const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
    const out: [number, number][] = [];
    let [curS, curE] = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const [s, e] = sorted[i];
      if (s <= curE) {
        curE = Math.max(curE, e);
      } else {
        out.push([curS, curE]);
        curS = s;
        curE = e;
      }
    }
    out.push([curS, curE]);
    return out;
  }

  // minutes -> 12-hr format without space -> "2:00PM"
  private _minutesTo12hString(minutes: number): string {
    const hh24 = Math.floor(minutes / 60) % 24;
    const mm = minutes % 60;
    const meridian = hh24 >= 12 ? 'PM' : 'AM';
    let hh12 = hh24 % 12;
    if (hh12 === 0) hh12 = 12;
    // ensure minutes are two digits
    const mmStr = mm.toString().padStart(2, '0');
    return `${hh12}:${mmStr}${meridian}`;
  }
}


