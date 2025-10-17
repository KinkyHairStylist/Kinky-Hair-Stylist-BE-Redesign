
import { 
  IsEmail, 
  IsPhoneNumber, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsArray, 
  ValidateNested, 
  IsString,
  MinLength,
  IsNumber,
  Min,
  IsMongoId, 
  IsDateString
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateClientProfileDto {
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
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;

  @IsOptional()
  @IsEnum(['he-him', 'she-her', 'they-them', 'other'])
  pronouns?: string;

  @IsOptional()
  occupation?: string;

  @IsEnum(['walk-in', 'referral', 'instagram', 'website', 'facebook', 'other'])
  clientSource: string;

  @IsOptional()
  profileImage?: string;
}

export class CreateClientAddressDto {
  @IsString()
  @MinLength(1)
  addressName: string;

  @IsString()
  @MinLength(1)
  addressLine1: string;

  @IsOptional()
  addressLine2?: string;

  @IsString()
  @MinLength(1)
  location: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  state?: string;

  @IsOptional()
  zipCode?: string;

  @IsOptional()
  country?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsMongoId()
  clientId: string;
}

export class CreateEmergencyContactDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  relationship: string;

  @IsString()
  @MinLength(1)
  phone: string;

  @IsMongoId()
  clientId: string;
}

export class CreateClientSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  marketingEmails?: boolean;

  @IsEnum(['vip', 'regular', 'new'])
  @IsOptional()
  clientType?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  preferences?: {
    preferredContactMethod?: 'email' | 'sms' | 'phone';
    language?: string;
    timezone?: string;
  };
}

export class CreateClientDto {
  @ValidateNested()
  @Type(() => CreateClientProfileDto)
  profile: CreateClientProfileDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClientAddressDto)
  @IsOptional()
  addresses?: CreateClientAddressDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEmergencyContactDto)
  @IsOptional()
  emergencyContacts?: CreateEmergencyContactDto[];

  @ValidateNested()
  @Type(() => CreateClientSettingsDto)
  @IsOptional()
  settings?: CreateClientSettingsDto;
}

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['male', 'female', 'other', 'prefer-not-to-say'])
  gender?: string;

  @IsOptional()
  @IsEnum(['he-him', 'she-her', 'they-them', 'other'])
  pronouns?: string;

  @IsOptional()
  occupation?: string;

  @IsOptional()
  @IsEnum(['walk-in', 'referral', 'instagram', 'website', 'facebook', 'other'])
  clientSource?: string;

  @IsOptional()
  profileImage?: string;
}

export class ClientFiltersDto {
  @IsOptional()
  search?: string;

  @IsOptional()
  @IsEnum(['vip', 'regular', 'new', 'all'])
  clientType?: string;

  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}