import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserStatus } from 'src/all_user_entities/user-status.entity';
import { ChatMessage } from 'src/all_user_entities/chat-message.entity';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { CloudinaryService } from 'src/helpers/cloudinary-massage-image-helper';
import { ChatController } from './chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, UserStatus])],
  providers: [ChatService, ChatGateway, CloudinaryService],
  controllers: [ChatController],
})
export class ChatModule {}
