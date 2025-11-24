import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ChatMessage } from 'src/all_user_entities/chat-message.entity';
import { UserStatus } from 'src/all_user_entities/user-status.entity';
import { User } from 'src/all_user_entities/user.entity';

export interface ChatListItem {
  userId: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  imageUrl?: string;
  isOnline: boolean;
  timestamp: Date;
  unreadCount: number,
  isRead: boolean
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepo: Repository<ChatMessage>,

    @InjectRepository(UserStatus)
    private statusRepo: Repository<UserStatus>,
  ) {}

  // Store a new message
  async storeMessage(data: {
    sender: User;
    receiver: User;
    message?: string;
    imageUrl?: string;
  }): Promise<ChatMessage> {
    const msg = this.chatRepo.create(data);
    return this.chatRepo.save(msg);
  }

  // Get user online/offline status
  async getUserStatus(userId: string): Promise<boolean> {
    const status = await this.statusRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    return status?.isOnline ?? false;
  }

  // Set user online/offline
  async setUserOnline(userId: string, isOnline: boolean) {
    let status = await this.statusRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!status) {
      status = this.statusRepo.create({
        user: { id: userId } as User,
        isOnline,
      });
    } else {
      status.isOnline = isOnline;
    }

    await this.statusRepo.save(status);
  }

  // Mark message as read
  async markAsRead(messageId: string) {
    const msg = await this.chatRepo.findOne({ where: { id: messageId } });
    if (msg && !msg.read) {
      msg.read = true;
      await this.chatRepo.save(msg);
    }
    return msg;
  }

  // Get all messages between two users
  async getMessagesBetween(userId1: string, userId2: string): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      where: [
        { sender: { id: userId1 }, receiver: { id: userId2 } },
        { sender: { id: userId2 }, receiver: { id: userId1 } },
      ],
      order: { createdAt: 'ASC' },
    });
  }

  // Get chat list for the signed-in user
  async getChatList(userId: string): Promise<ChatListItem[]> {
    const messages = await this.chatRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.receiver', 'receiver')
      .leftJoinAndSelect('msg.sender', 'sender')
      .where('sender.id = :userId OR receiver.id = :userId', { userId })
      .orderBy('msg.createdAt', 'DESC')
      .getMany();

    const convMap = new Map<string, ChatMessage>();

    messages.forEach(msg => {
      const otherUserId =
        msg.sender.id === userId ? msg.receiver.id : msg.sender.id;

      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, msg);
      }
    });

    const chatList: ChatListItem[] = [];

    for (const [otherUserId, msg] of convMap.entries()) {
      const isOnline = await this.getUserStatus(otherUserId);
      const otherUser =
        msg.sender.id === userId ? msg.receiver : msg.sender;

      const name =
        `${otherUser.firstName ?? ''} ${otherUser.surname ?? ''}`.trim() ||
        'Unknown';

      const isRead = msg.read;

      const unreadCount = await this.chatRepo.count({
        where: {
          sender: { id: otherUser.id },
          receiver: { id: userId },
          read: false,
        },
      });

      chatList.push({
        userId: otherUser.id,
        name,
        avatarUrl: otherUser.avatarUrl ?? '',
        lastMessage: msg.message || '[Image]',
        imageUrl: msg.imageUrl,
        isOnline,
        timestamp: msg.createdAt,
        isRead,
        unreadCount
      });
    }

    return chatList.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }
}
