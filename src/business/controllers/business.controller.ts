import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';
import { UserDocument } from '../schemas/user.schema';
import { BusinessService } from '../services/business.service';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';

interface RequestWithUser extends Request {
  user: UserDocument;
}

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBusinessDto: CreateBusinessDto,
    @Req() req: RequestWithUser,
  ) {
    const owner = req.user;

    const business = await this.businessService.create(
      createBusinessDto,
      owner,
    );
    return {
      message: 'Business created successfully.',
      businessId: business._id,
      businessName: business.businessName,
    };
  }
}
