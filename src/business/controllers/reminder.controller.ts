import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ReminderService } from '../services/reminder.service';
import { JwtAuthGuard } from 'src/middleware/jwt-auth.guard';
import { SendReminderDto } from '../dtos/requests/Reminder.dto';

@Controller('reminders')
// @UseGuards(JwtAuthGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('/send')
  async sendReminder(@Request() req, @Body() reminderData: SendReminderDto) {
    const result = await this.reminderService.sendReminder(reminderData);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
