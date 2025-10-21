import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
  Delete,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  async getAll() {
    return this.withdrawalService.findAll();
  }

  @Get('pending')
  async getPending() {
    return this.withdrawalService.getPending();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.withdrawalService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateWithdrawalDto) {
    return this.withdrawalService.create(dto);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.withdrawalService.approve(id);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.withdrawalService.reject(id);
  }
  
  @Delete('delete/all')
  async deleteAll() {
    return this.withdrawalService.deleteAll();
  }
}
