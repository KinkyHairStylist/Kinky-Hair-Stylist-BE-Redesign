import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateGuidelineDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) items?: string[];
  @IsOptional() @IsInt() position?: number;
}