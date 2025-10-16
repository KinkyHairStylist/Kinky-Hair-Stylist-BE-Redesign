import { 
  IsString, 
  IsArray, 
  IsEnum, 
  IsNumber, 
  Min, 
  IsObject, 
  ValidateNested,
  IsOptional,
  IsBoolean,
  MinLength 
} from 'class-validator';
import { Type } from 'class-transformer';

export class BookingPoliciesDto {
  @IsNumber()
  @Min(0)
  minimumLeadTime: number;

  @IsNumber()
  @Min(0)
  bufferTime: number;

  @IsNumber()
  @Min(0)
  cancellationWindow: number;

  @IsNumber()
  @Min(0)
  depositAmount: number;
}

export class BookingHoursDto {
  @IsEnum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  day: string;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;
}

export class CreateBusinessDto {
  @IsString()
  @MinLength(1)
  businessName: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsString()
  @MinLength(1)
  primaryAudience: string;

  @IsArray()
  @IsString({ each: true })
  services: string[];

  @IsString()
  @MinLength(1)
  businessAddress: string;

  @ValidateNested()
  @Type(() => BookingPoliciesDto)
  bookingPolicies: BookingPoliciesDto;

  @IsEnum(['1-5', '6-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
  companySize: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookingHoursDto)
  bookingHours: BookingHoursDto[];

  @IsString()
  @MinLength(1)
  howDidYouHear: string;
}