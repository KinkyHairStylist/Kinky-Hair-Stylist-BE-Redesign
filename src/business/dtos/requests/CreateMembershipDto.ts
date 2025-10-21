import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    IsEnum,
} from 'class-validator';
import { BillingCycle } from '../../entities/membership.entity';

export class CreateMembershipPlanDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    tier: string;

    @IsNumber()
    price: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @IsOptional()
    features?: string[];

    @IsBoolean()
    @IsOptional()
    autoRenewalEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    visibleToPublic?: boolean;

    @IsEnum(BillingCycle)
    @IsOptional()
    billingCycle?: BillingCycle;
}
