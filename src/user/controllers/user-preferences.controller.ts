import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserPreferencesService } from '../services/preferences.service';
import { UpdateUserPreferencesDto } from '../dtos/update-user-preferences.dto';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { GetUser } from 'src/middleware/get-user.decorator';
import { User } from 'src/all_user_entities/user.entity';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('User Preferences')
@ApiBearerAuth("access-token")
@Controller('user/preferences')
export class UserPreferencesController {
  constructor(private readonly preferencesService: UserPreferencesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserPreferences(@GetUser() user: User) {
    return this.preferencesService.getUserPreferences(user);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateUserPreferences(
    @GetUser() user: User,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.preferencesService.updateUserPreferences(user, dto);
  }
}
