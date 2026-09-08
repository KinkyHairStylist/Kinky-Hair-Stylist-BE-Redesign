import {IsString, IsOptional, IsArray, IsEmail, IsObject, IsNumber, Min, Max} from 'class-validator';
import { BusinessStaffRole } from 'src/middleware/business-staff-role.enum';

export class EditStaffDto {
    @IsString()
    @IsOptional()
    role?: BusinessStaffRole;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsString()
    @IsOptional()
    dob?: string;

    @IsString()
    @IsOptional()
    jobTitle?: string;

    @IsString()
    @IsOptional()
    employmentType?: 'full-time' | 'part-time' | 'contract';

    @IsArray()
    @IsOptional()
    addresses?:any;

    @IsOptional()
    settings?: any;

    @IsArray()
    @IsOptional()
    emergencyContacts?: any;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsArray()
    @IsOptional()
    servicesAssigned?: string[];

    @IsString()
    @IsOptional()
    selectedLocation?: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    commissionRate?: number;
}