import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus, PaymentStatus } from 'src/business/entities/appointment.entity';
import { Business } from 'src/business/entities/business.entity';
import { Service } from 'src/business/entities/service.entity';
import { Staff } from 'src/business/entities/staff.entity';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus as TxnStatus } from 'src/business/entities/transaction.entity';
import { WalletCurrency } from 'src/admin/payment/enums/wallet.enum';
// import { PayPalService } from './paypal.service';

import { GiftCard, GiftCardStatus } from 'src/all_user_entities/gift-card.entity';
import { User } from 'src/all_user_entities/user.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Appointment)
    private bookingRepository: Repository<Appointment>,
    @InjectRepository(Business)
    private businessRepository: Repository<Business>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(GiftCard)
    private giftCardRepository: Repository<GiftCard>,
  ) {}

  // Create Booking
  async createBooking(createBookingDto: any, user: User): Promise<{ orderId: string, appointments: Appointment[] }> {
    // Get business
    const business = await this.businessRepository.findOne({
      where: { id: createBookingDto.salonId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    // Generate order ID
    const orderId = `BKID-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const appointments: Appointment[] = [];

    // Create appointments for each service
    for (const serviceId of createBookingDto.serviceIds) {
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId },
        relations: ['assignedStaff'],
      });

      if (!service) {
        throw new NotFoundException(`Service with ID ${serviceId} not found`);
      }

      const appointment = this.bookingRepository.create({
        client: user,
        business,
        service,
        serviceName: service.name,
        orderId,
        date: createBookingDto.date,
        time: createBookingDto.time,
        duration: service.duration,
        amount: service.price,
        status: AppointmentStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        staff: service.assignedStaff ? [service.assignedStaff] : [],
      });

      appointments.push(appointment);
    }

    // Save appointments
    await this.bookingRepository.save(appointments);

    return { orderId, appointments };
  }

  // Confirm Booking
  async confirmBooking(confirmBookingDto: any, user: User): Promise<{ message: string }> {
    const { orderId, payAtVenue, cardId, giftCard } = confirmBookingDto;

    // Find all appointments for this orderId
    const appointments = await this.bookingRepository.find({
      where: { orderId, client: { id: user.id } }, // Ensure user owns the appointments
      relations: ['business'],
    });

    if (appointments.length === 0) {
      throw new NotFoundException('No appointments found for this order ID');
    }

    const totalAmount = appointments.reduce((sum, appt) => sum + appt.amount, 0);
    let remainingAmount = totalAmount;
    const transactions: Transaction[] = [];

    // Handle gift card payment
    if (giftCard) {
      const gift = await this.giftCardRepository.findOne({
        where: { code: giftCard }
      });
      if (!gift) {
        throw new BadRequestException('Gift card not found');
      }
      if (gift.currentBalance >= remainingAmount) {
        gift.currentBalance -= remainingAmount;
        if (gift.currentBalance === 0) {
          gift.status = GiftCardStatus.USED;
          gift.usedAt = new Date();
        }
        await this.giftCardRepository.save(gift);
        remainingAmount = 0;

        // Create transaction
        const transaction = this.transactionRepository.create({
          senderId: user.id,
          sender: user,
          recipientId: appointments[0].business.owner?.id,
          recipient: appointments[0].business.owner,
          amount: totalAmount,
          currency: WalletCurrency.USD,
          type: TransactionType.DEBIT,
          description: `Gift card payment for appointment order ${orderId}`,
          method: PaymentMethod.GIFTCARD,
          status: TxnStatus.COMPLETED,
          referenceId: orderId,
        });
        transactions.push(transaction);
      } else {
        throw new BadRequestException('Insufficient gift card balance');
      }
    }

    // Handle pay at venue
    if (payAtVenue && remainingAmount > 0) {
      // Create transaction for pay at venue
      const transaction = this.transactionRepository.create({
        senderId: user.id,
        sender: user,
        recipientId: appointments[0].business.owner?.id,
        recipient: appointments[0].business.owner,
        amount: remainingAmount + 10, // Add additional 10 for pay at venue
        currency: WalletCurrency.USD,
        type: TransactionType.DEBIT,
        description: `Pay at venue for appointment order ${orderId} (includes additional charges)`,
        method: PaymentMethod.CASH, // assuming CASH for pay at venue
        status: TxnStatus.PENDING, // pending until paid
        referenceId: orderId,
      });
      transactions.push(transaction);
      remainingAmount = 0;
    }

    // Handle card payment (Paystack)
    if (cardId && remainingAmount > 0) {
      // TODO: integrate Paystack payment here
      // For now, assume payment is successful
      const transaction = this.transactionRepository.create({
        senderId: user.id,
        sender: user,
        recipientId: appointments[0].business.owner?.id,
        recipient: appointments[0].business.owner,
        amount: remainingAmount,
        currency: WalletCurrency.USD,
        type: TransactionType.DEBIT,
        description: `Paystack payment for appointment order ${orderId}`,
        method: PaymentMethod.PAYSTACK,
        status: TxnStatus.COMPLETED,
        referenceId: orderId,
      });
      transactions.push(transaction);
      remainingAmount = 0;
    }

    // Save transactions
    if (transactions.length > 0) {
      await this.transactionRepository.save(transactions);
    }

    // Update appointment statuses
    for (const appointment of appointments) {
      appointment.status = AppointmentStatus.CONFIRMED;
      appointment.paymentStatus = remainingAmount === 0 ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    }
    await this.bookingRepository.save(appointments);

    return { message: 'Booking confirmed successfully' };
  }

  
  // Get User Bookings
  async getUserBookings(userId: string): Promise<Appointment[]> {
    return await this.bookingRepository.find({
      where: { client: { id: userId } },
      relations: ['business', 'service', 'staff'],
    });
  }

  // Get Booking by ID
  async getBookingById(orderId: string): Promise<Appointment> {
    const appointment = await this.bookingRepository.findOne({
      where: { orderId },
      relations: ['business', 'service', 'staff', 'client'],
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  // Cancel Booking
  async cancelBooking(orderId: string): Promise<{ message: string }> {
    const appointment = await this.bookingRepository.findOne({
      where: { orderId },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    appointment.status = AppointmentStatus.CANCELLED;
    await this.bookingRepository.save(appointment);
    return { message: 'Appointment cancelled successfully' };
  }

  // Reschedule Booking
  async rescheduleBooking(orderId: string, newDate: Date, newTime: string): Promise<{ message: string }> {
    const appointment = await this.bookingRepository.findOne({
      where: { orderId },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    appointment.date = newDate.toISOString().split('T')[0]; // Format as date string
    appointment.time = newTime;
    appointment.status = AppointmentStatus.RESCHEDULED;
    await this.bookingRepository.save(appointment);
    return { message: 'Appointment rescheduled successfully' };
  }
}
