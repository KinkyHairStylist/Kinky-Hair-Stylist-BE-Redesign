import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';

export class EditStaffDto {
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
    servicesAssigned?: string[];

    @IsString()
    @IsOptional()
    selectedLocation?: string;
}
