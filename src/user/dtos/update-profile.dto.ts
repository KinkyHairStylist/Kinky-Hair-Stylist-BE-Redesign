import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsPhoneNumber, IsDateString } from 'class-validator';
import { Gender } from 'src/business/types/constants';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: 'First name of the user', example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Surname of the user', example: 'Doe' })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiPropertyOptional({ description: 'User phone number', example: '+2348123456789' })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth of the user', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;
}
