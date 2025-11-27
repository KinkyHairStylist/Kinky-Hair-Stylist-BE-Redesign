import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';
// @IsString()

export class CreateStaffDto {

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  dob?: string; // string as requested

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  employmentType?: 'full-time' | 'part-time' | 'contract';

  @IsArray()
  @IsOptional()
  addresses?: { name: string; location: string; isPrimary?: boolean }[];

  @IsArray()
  @IsOptional()
  emergencyContacts?: {
    firstName: string;
    lastName?: string;
    relationship: string;
    email: string;
    phoneNumber: string;
  }[];

  @IsArray()
  @IsOptional()
  selectedServices?: string[];

  @IsArray()
  @IsOptional()
  servicesAssigned:string[]

  @IsString()
  @IsOptional()
  selectedLocation?: string;
}
