import {
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReminderRuleDto {
  @IsString()
  messageType: string;

  @IsNumber()
  @Min(1)
  @Max(168)
  reminderHoursBeforeAppointment: number;

  @IsString()
  reminderMessage: string;
}

export class BusinessNotificationsDto {
  @IsBoolean()
  @IsOptional()
  newBookingAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  cancellationAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  dailySummaryReports?: boolean;
}

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  enableAutomatedReminders?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReminderRuleDto)
  @IsOptional()
  reminderRules?: ReminderRuleDto[];

  @ValidateNested()
  @Type(() => BusinessNotificationsDto)
  @IsOptional()
  businessNotifications?: BusinessNotificationsDto;
}

export class BookingRulesDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumLeadTimeHours?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bufferTimeBetweenAppointmentsMinutes?: number;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  maximumAdvanceBookingDays?: number;

  @IsString()
  @IsOptional()
  sameDayBookingCutoff?: string;

  @IsBoolean()
  @IsOptional()
  enableWaitlist?: boolean;

  @IsBoolean()
  @IsOptional()
  autoNotifyWaitlist?: boolean;

  @IsBoolean()
  @IsOptional()
  allowDoubleBookings?: boolean;
}

export class ClientManagementDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  noShowLimit?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  restrictionPeriodDays?: number;

  @IsBoolean()
  @IsOptional()
  requirePhoneVerification?: boolean;

  @IsBoolean()
  @IsOptional()
  allowGuestBooking?: boolean;

  @IsBoolean()
  @IsOptional()
  collectClientFeedback?: boolean;

  @IsBoolean()
  @IsOptional()
  weeklyNoShowReports?: boolean;

  @IsBoolean()
  @IsOptional()
  clientNoShowPattern?: boolean;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  reportRecipients?: string[];
}

export class CreateBusinessOwnerSettingsDto {
  @IsString()
  businessId: string;

  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @IsOptional()
  notifications?: NotificationSettingsDto;

  @ValidateNested()
  @Type(() => BookingRulesDto)
  @IsOptional()
  bookingRules?: BookingRulesDto;

  @ValidateNested()
  @Type(() => ClientManagementDto)
  @IsOptional()
  clientManagement?: ClientManagementDto;
}

export class UpdateBusinessOwnerSettingsDto {
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @IsOptional()
  notifications?: NotificationSettingsDto;

  @ValidateNested()
  @Type(() => BookingRulesDto)
  @IsOptional()
  bookingRules?: BookingRulesDto;

  @ValidateNested()
  @Type(() => ClientManagementDto)
  @IsOptional()
  clientManagement?: ClientManagementDto;
}
