import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { GetUser } from 'src/middleware/get-user.decorator';
import { User } from 'src/all_user_entities/user.entity';
import { CardService } from '../services/card.service';
import { CreateCardDto } from '../dtos/create-card.dto';
import { Role } from 'src/middleware/role.enum';
import { RolesGuard } from 'src/middleware/roles.guard';
import { Roles } from 'src/middleware/roles.decorator';


@ApiTags('Customer Card and Gift Cards')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Client)
@Controller('users/cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('add')
  @ApiOperation({ summary: 'Add a new payment card' })
  @ApiResponse({ status: 201, description: 'Card successfully added' })
  async addCard(@Body() dto: CreateCardDto, @GetUser() user: User) {
    return this.cardService.createCard(dto, user);
  }

  @Get('my-card')
  @ApiOperation({ summary: 'Get all saved cards for the authenticated user' })
  async getAuthCards(@GetUser() user: User) {
    return this.cardService.getAllAuthCards(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved cards' })
  async getCards() {
    return this.cardService.getAllCards();
  }
}
