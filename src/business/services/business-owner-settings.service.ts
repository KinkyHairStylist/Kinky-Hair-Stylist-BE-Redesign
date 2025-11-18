import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookingRules,
  BusinessNotifications,
  BusinessOwnerSettings,
  ClientManagement,
  NotificationSettings,
} from '../entities/business-owner-settings.entity';
import {
  CreateBusinessOwnerSettingsDto,
  UpdateBusinessOwnerSettingsDto,
} from '../dtos/requests/BusinessOwnerSettingsDto';

@Injectable()
export class BusinessOwnerSettingsService {
  constructor(
    @InjectRepository(BusinessOwnerSettings)
    private readonly businessOwnerSettingsRepository: Repository<BusinessOwnerSettings>,
  ) {}

  // async create(
  //   createDto: CreateBusinessOwnerSettingsDto,
  // ): Promise<BusinessOwnerSettings> {
  //   const existing = await this.businessOwnerSettingsRepository.findOne({
  //     where: { businessId: createDto.businessId },
  //   });

  //   if (existing) {
  //     throw new ConflictException(
  //       `Settings already exist for business ${createDto.businessId}`,
  //     );
  //   }

  //   const settings = this.businessOwnerSettingsRepository.create({
  //     businessId: createDto.businessId,
  //     notifications: {
  //       enableAutomatedReminders:
  //         createDto.notifications?.enableAutomatedReminders ?? false,
  //       reminderRules: createDto.notifications?.reminderRules ?? [],
  //       businessNotifications: {
  //         newBookingAlerts:
  //           createDto.notifications?.businessNotifications
  //             ?.newBookingAlerts ?? false,
  //         cancellationAlerts:
  //           createDto.notifications?.businessNotifications
  //             ?.cancellationAlerts ?? false,
  //         dailySummaryReports:
  //           createDto.notifications?.businessNotifications
  //             ?.dailySummaryReports ?? false,
  //       },
  //     },
  //     bookingRules: {
  //       minimumLeadTimeHours:
  //         createDto.bookingRules?.minimumLeadTimeHours ?? 24,
  //       bufferTimeBetweenAppointmentsMinutes:
  //         createDto.bookingRules?.bufferTimeBetweenAppointmentsMinutes ?? 0,
  //       maximumAdvanceBookingDays:
  //         createDto.bookingRules?.maximumAdvanceBookingDays ?? 90,
  //       sameDayBookingCutoff:
  //         createDto.bookingRules?.sameDayBookingCutoff ?? null,
  //       enableWaitlist: createDto.bookingRules?.enableWaitlist ?? false,
  //       autoNotifyWaitlist: createDto.bookingRules?.autoNotifyWaitlist ?? false,
  //       allowDoubleBookings:
  //         createDto.bookingRules?.allowDoubleBookings ?? false,
  //     },
  //     clientManagement: {
  //       noShowLimit: createDto.clientManagement?.noShowLimit ?? 3,
  //       restrictionPeriodDays:
  //         createDto.clientManagement?.restrictionPeriodDays ?? 30,
  //       requirePhoneVerification:
  //         createDto.clientManagement?.requirePhoneVerification ?? false,
  //       allowGuestBooking:
  //         createDto.clientManagement?.allowGuestBooking ?? true,
  //       collectClientFeedback:
  //         createDto.clientManagement?.collectClientFeedback ?? false,
  //       weeklyNoShowReports:
  //         createDto.clientManagement?.weeklyNoShowReports ?? false,
  //       clientNoShowPattern:
  //         createDto.clientManagement?.clientNoShowPattern ?? false,
  //       reportRecipients: createDto.clientManagement?.reportRecipients ?? [],
  //     },
  //   });

  //   return await this.businessOwnerSettingsRepository.save(settings);
  // }

  async findByBusinessId(businessId: string): Promise<BusinessOwnerSettings> {
    const settings = await this.businessOwnerSettingsRepository.findOne({
      where: { businessId },
    });

    if (!settings) {
      throw new NotFoundException(
        `Settings not found for business ${businessId}`,
      );
    }

    return settings;
  }
  async findByOwnerId(ownerId: string): Promise<BusinessOwnerSettings | null> {
    const settings = await this.businessOwnerSettingsRepository.findOne({
      where: { ownerId },
    });

    return settings;
  }

  async update(
    ownerId: string,
    businessId: string,
    updateDto: UpdateBusinessOwnerSettingsDto,
  ): Promise<BusinessOwnerSettings> {
    let settings = await this.findByOwnerId(ownerId);

    // If it doesn't exist → create a new empty settings object
    if (!settings) {
      settings = this.businessOwnerSettingsRepository.create({
        ownerId,
        businessId,
      });
    }

    // --------- FIX: Initialize missing nested objects ----------
    if (!settings.notifications) {
      settings.notifications = new NotificationSettings();
    }

    if (!settings.notifications.businessNotifications) {
      settings.notifications.businessNotifications =
        new BusinessNotifications();
    }

    if (!settings.notifications.reminderRules) {
      settings.notifications.reminderRules = [];
    }

    if (!settings.bookingRules) {
      settings.bookingRules = new BookingRules();
    }

    if (!settings.clientManagement) {
      settings.clientManagement = new ClientManagement();
    }

    if (updateDto.notifications) {
      const incoming = updateDto.notifications;

      // Initialize missing structure once
      if (!settings.notifications)
        settings.notifications = new NotificationSettings();
      if (!settings.notifications.businessNotifications)
        settings.notifications.businessNotifications =
          new BusinessNotifications();

      // enableAutomatedReminders
      if (incoming.enableAutomatedReminders !== undefined) {
        settings.notifications.enableAutomatedReminders =
          incoming.enableAutomatedReminders;
      }

      // reminderRules
      if (incoming.reminderRules !== undefined) {
        settings.notifications.reminderRules = incoming.reminderRules;
      }

      // businessNotifications (nested)
      if (incoming.businessNotifications) {
        settings.notifications.businessNotifications = {
          ...settings.notifications.businessNotifications,
          ...incoming.businessNotifications,
        };
      }
    }

    // Deep merge bookingRules
    if (updateDto.bookingRules) {
      settings.bookingRules = {
        ...settings.bookingRules,
        ...updateDto.bookingRules,
      };
    }

    // Deep merge clientManagement
    if (updateDto.clientManagement) {
      settings.clientManagement = {
        ...settings.clientManagement,
        ...updateDto.clientManagement,
      };
    }

    return await this.businessOwnerSettingsRepository.save(settings);
  }

  async delete(businessId: string): Promise<void> {
    const settings = await this.findByBusinessId(businessId);
    await this.businessOwnerSettingsRepository.remove(settings);
  }

  async findAll(): Promise<BusinessOwnerSettings[]> {
    return await this.businessOwnerSettingsRepository.find();
  }
}
