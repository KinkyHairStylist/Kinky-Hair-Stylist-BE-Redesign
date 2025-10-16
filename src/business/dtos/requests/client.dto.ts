import { 
  IsString, 
  IsEmail, 
  IsPhoneNumber, 
  IsDate, 
  IsOptional, 
  IsBoolean, 
  IsEnum, 
  IsArray, 
  ValidateNested,
  MinLength,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

// Define ClientPreferencesDto FIRST to avoid circular dependency
export class ClientPreferencesDto {
  @IsOptional()
  @IsEnum(['email', 'sms', 'phone'])
  preferredContactMethod?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class ClientProfileDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  pronouns?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsString()
  @MinLength(1)
  clientSource: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

export class ClientAddressDto {
  @IsString()
  @MinLength(1)
  addressName: string;

  @IsString()
  @MinLength(1)
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @MinLength(1)
  location: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @MinLength(1)
  state: string;

  @IsString()
  @MinLength(1)
  zipCode: string;

  @IsString()
  @MinLength(1)
  country: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class EmergencyContactDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  relationship: string;

  @IsString()
  @MinLength(1)
  phone: string;
}

export class ClientSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmails?: boolean;

  @IsOptional()
  @IsEnum(['regular', 'vip', 'new'])
  clientType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientPreferencesDto)
  preferences?: ClientPreferencesDto;
}

export class CreateClientDto {
  @ValidateNested()
  @Type(() => ClientProfileDto)
  profile: ClientProfileDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientAddressDto)
  addresses?: ClientAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSettingsDto)
  settings?: ClientSettingsDto;
}

export class UpdateClientDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientProfileDto)
  profile?: ClientProfileDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientAddressDto)
  addresses?: ClientAddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientSettingsDto)
  settings?: ClientSettingsDto;
}

export class ClientFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['regular', 'vip', 'new', 'all'])
  clientType?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

export class CreateClientAddressDto {
  @IsString()
  @MinLength(1)
  addressName: string;

  @IsString()
  @MinLength(1)
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @MinLength(1)
  location: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @MinLength(1)
  state: string;

  @IsString()
  @MinLength(1)
  zipCode: string;

  @IsString()
  @MinLength(1)
  country: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsString()
  @MinLength(1)
  clientId: string;
}

export class CreateEmergencyContactDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  relationship: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsString()
  @MinLength(1)
  clientId: string;
}