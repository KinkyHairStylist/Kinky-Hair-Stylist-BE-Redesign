import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GiftCard,
  GiftCardStatus,
} from '../../all_user_entities/gift-card.entity';
import {
  CustomerCreateGiftCardDto,
  ValidateGiftCardDto,
  RedeemGiftCardDto,
} from './../dtos/create-gift-card.dto';
import { User } from '../../all_user_entities/user.entity';
import { Card } from './../../all_user_entities/card.entity';

@Injectable()
export class GiftCardService {
  constructor(
    @InjectRepository(GiftCard)
    private readonly giftCardRepo: Repository<GiftCard>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  /** 🪙 Purchase a new gift card */
  async createGiftCard(
    dto: CustomerCreateGiftCardDto,
    sender: User,
  ): Promise<GiftCard> {
    const card = await this.cardRepo.findOne({
      where: { id: dto.cardId },
      relations: ['user'],
    });
    if (!card) throw new NotFoundException('Selected payment method not found');

    if (card.user.id !== sender.id) {
      throw new ForbiddenException(
        'You are not authorized to use this payment method.',
      );
    }

    const giftCard = this.giftCardRepo.create({
      recipientName: dto.recipientName,
      recipientEmail: dto.recipientEmail,
      senderName: dto.senderName,
      personalMessage: dto.personalMessage,
      amount: dto.amount,
      sender,
      card,
      status: GiftCardStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // expires in 7 days
    });

    return await this.giftCardRepo.save(giftCard);
  }

  /** ✅ Validate a gift card by code only */
  async validateGiftCard(dto: ValidateGiftCardDto) {
    const giftCard = await this.giftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard) throw new NotFoundException('Gift card not found');

    const now = new Date();

    if (giftCard.status !== GiftCardStatus.ACTIVE)
      return { valid: false, reason: 'Gift card already used or inactive' };

    if (giftCard.expiresAt && giftCard.expiresAt < now)
      return { valid: false, reason: 'Gift card expired' };

    return {
      valid: true,
      message: 'Gift card is valid',
      amount: giftCard.amount,
      expiresAt: giftCard.expiresAt,
      status: giftCard.status,
    };
  }

  /** 🎁 Redeem a gift card using its code only */
  async redeemGiftCard(dto: RedeemGiftCardDto, user: User) {
    const giftCard = await this.giftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard) throw new NotFoundException('Gift card not found');
    if (giftCard.status !== GiftCardStatus.ACTIVE)
      throw new BadRequestException('Gift card already used or inactive');

    const now = new Date();

    if (giftCard.expiresAt && giftCard.expiresAt < now) {
      giftCard.status = GiftCardStatus.EXPIRED;
      await this.giftCardRepo.save(giftCard);
      throw new BadRequestException('Gift card has expired');
    }

    giftCard.status = GiftCardStatus.USED;
    giftCard.usedAt = now;
    await this.giftCardRepo.save(giftCard);

    return {
      message: 'Gift card successfully redeemed',
      code: giftCard.code,
      amount: giftCard.amount,
      usedAt: giftCard.usedAt,
    };
  }



  // Get card Summery for a user
  async getGiftCardStatsByUser(user: User) {
    const [activeCount, usedCount, totalAmountResult] = await Promise.all([
      this.giftCardRepo.count({
        where: { status: GiftCardStatus.ACTIVE, sender: { id: user.id } },
      }),
      this.giftCardRepo.count({
        where: { status: GiftCardStatus.USED, sender: { id: user.id } },
      }),
      this.giftCardRepo
        .createQueryBuilder('giftCard')
        .select('SUM(giftCard.amount)', 'total')
        .where('giftCard.senderId = :userId', { userId: user.id })
        .getRawOne(),
    ]);

    const totalAmountSent = parseFloat(totalAmountResult?.total || '0');

    return {
      totalAmountSent,
      activeCount,
      usedCount,
    };
  }

  /** 📜 Get all gift cards (for admin/testing) */
  async getAllGiftCards(): Promise<GiftCard[]> {
    return await this.giftCardRepo.find();
  }
}
