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
import { CommunicationService } from '../services/communication.service';
import {
  SendBulkMessageDto,
  SendDirectMessageDto,
} from '../dtos/requests/CommunicationDto';

@Controller('communications')
// @UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('/send-direct-message')
  async sendCommunicationDirectMessage(
    @Request() req,
    @Body() directMessageData: SendDirectMessageDto,
  ) {
    const result =
      await this.communicationService.sendDirectMessage(directMessageData);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  @Post('/send-bulk-messages')
  async sendCommunicationBulkMessages(
    @Request() req,
    @Body() bulkMessagesData: SendBulkMessageDto,
  ) {
    const result =
      await this.communicationService.sendBulkCustomMessages(bulkMessagesData);

    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
