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
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';
import {
  ClientSource,
  Gender,
  Pronouns,
} from 'src/business/entities/client.entity';
import {
  ClientType,
  PreferredContactMethod,
} from 'src/business/entities/client-settings.entity';

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
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Pronouns)
  pronouns?: Pronouns;

  @IsOptional()
  occupation?: string;

  @IsEnum(ClientSource)
  clientSource: ClientSource;

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

  @IsString()
  @MinLength(1)
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

  @IsString()
  @MinLength(1)
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

  @IsEnum(ClientType)
  @IsOptional()
  clientType?: ClientType;

  @IsOptional()
  notes?: string;

  @IsString()
  @MinLength(1)
  clientId: string;

  preferences: {
    preferredContactMethod: PreferredContactMethod;
    language: string;
    timezone: string;
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
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Pronouns)
  pronouns?: Pronouns;

  @IsOptional()
  occupation?: string;

  @IsOptional()
  @IsEnum(ClientSource)
  clientSource?: ClientSource;

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
