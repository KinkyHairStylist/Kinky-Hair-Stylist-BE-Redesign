import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dtos/requests/business.dto';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';

// Import or define ApiResponse interface
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Extended interface for create business response
interface CreateBusinessResponse extends ApiResponse {
  businessId?: string;
}

@Controller('business')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  async createBusiness(
    @Request() req,
    @Body() createBusinessDto: CreateBusinessDto,
  ): Promise<CreateBusinessResponse> {
    const owner = req.user;
    if (!owner) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const business = await this.businessService.createBusiness(createBusinessDto, owner.id);

    if (!business.success) {
      throw new HttpException(
        { message: business.message, error: business.error },
        HttpStatus.BAD_REQUEST
      );
    }

    // Return the business response with additional businessId property
    return {
      ...business,
      businessId: business.data.id,
    };
  }

  @Get()
  async getBusiness(@Request() req): Promise<ApiResponse> {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.businessService.getBusinessByOwner(ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }

  @Get('details')
  async getBusinessDetails(@Request() req): Promise<ApiResponse> {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.businessService.getBusinessDetails(ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }
}