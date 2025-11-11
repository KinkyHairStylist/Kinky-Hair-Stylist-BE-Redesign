import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { CustomMessageService } from '../services/custom-message.service';
import { SendCustomMessageDto } from '../dtos/requests/CustomMesssageDto';

@Controller('custom-messages')
// @UseGuards(JwtAuthGuard)
export class CustomMessageController {
  constructor(private readonly customMessageService: CustomMessageService) {}

  @Post('/send-email')
  async sendCustomMessageEmail(
    @Request() req,
    @Body() customMessageData: SendCustomMessageDto,
  ) {
    const result =
      await this.customMessageService.sendCustomMessage(customMessageData);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
