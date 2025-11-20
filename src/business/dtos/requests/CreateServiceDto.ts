import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    userMail: string;

    @IsOptional()
    images: string[];

    @IsOptional()
    @IsString()
    category?: string;

    @IsString()
    @IsOptional()
    description: string;

    @IsNumber()
    price: number;

    @IsString()
    @IsOptional()
    duration: string;

    @IsOptional()
    @IsUUID()
    advertisementPlanId?: string;

    @IsOptional()
    @IsUUID()
    businessId?: string;

    @IsOptional()
    @IsUUID()
    assignedStaffId?: string;
}
