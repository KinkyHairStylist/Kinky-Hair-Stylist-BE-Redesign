import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessGiftCard } from 'src/business/entities/business-giftcard.entity';
import {
  BusinessGiftCardSoldStatus,
  BusinessGiftCardStatus,
} from 'src/business/enum/gift-card.enum';

import {
  PurchaseBusinessGiftCardDto,
  RedeemGiftCardDto,
  ValidateGiftCardDto,
} from './../dtos/create-gift-card.dto';

import { Card } from '../../all_user_entities/card.entity';
import { User } from '../../all_user_entities/user.entity';

@Injectable()
export class GiftCardService {
  constructor(
    @InjectRepository(BusinessGiftCard)
    private readonly businessGiftCardRepo: Repository<BusinessGiftCard>,

    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  /** 🎁 Purchase a business gift card */
  async purchaseGiftCard(dto: PurchaseBusinessGiftCardDto, purchaser: User) {
    const giftCard = await this.businessGiftCardRepo.findOne({
      where: { id: dto.businessGiftCardId },
    });

    if (!giftCard)
      throw new NotFoundException('Gift card not found');

    if (giftCard.soldStatus !== BusinessGiftCardSoldStatus.AVAILABLE)
      throw new BadRequestException('Gift card already purchased');

    // Verify payment card belongs to purchaser
    const card = await this.cardRepo.findOne({
      where: { id: dto.cardId },
      relations: ['user'],
    });

    if (!card) throw new NotFoundException('Payment card not found');

    if (card.user.id !== purchaser.id)
      throw new ForbiddenException('You cannot use this payment method');

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + giftCard.expiryInDays);

    // Update gift card ownership
    giftCard.ownerId = purchaser.id;
    giftCard.ownerEmail = purchaser.email;
    giftCard.ownerFullName = `${purchaser.firstName} ${purchaser.surname}`;

    giftCard.cardId = dto.cardId;

    giftCard.recipientName = dto.recipientName;
    giftCard.recipientEmail = dto.recipientEmail;
    giftCard.message = dto.message || 'No message';
    giftCard.ownerFullName = dto.fullName;

    giftCard.expiresAt = expiryDate;
    giftCard.soldStatus = BusinessGiftCardSoldStatus.PURCHASED;

    await this.businessGiftCardRepo.save(giftCard);

    return {
      message: 'Gift card purchased successfully',
      giftCard,
    };
  }

  /** 🔎 Validate gift card by code */
  async validateGiftCard(dto: ValidateGiftCardDto) {
    const giftCard = await this.businessGiftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard)
      throw new NotFoundException('Gift card not found');

    const now = new Date();

    if (giftCard.expiresAt < now)
      return { valid: false, reason: 'Gift card expired' };

    if (giftCard.soldStatus !== BusinessGiftCardSoldStatus.PURCHASED)
      return { valid: false, reason: 'Not purchased yet' };

    if (giftCard.remainingAmount <= 0)
      return { valid: false, reason: 'Gift card already fully redeemed' };

    return {
      valid: true,
      amount: giftCard.remainingAmount,
      expiresAt: giftCard.expiresAt,
      status: giftCard.status,
    };
  }

  /** ✔ Redeem gift card */
  async redeemGiftCard(dto: RedeemGiftCardDto, user: User) {
    const giftCard = await this.businessGiftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard)
      throw new NotFoundException('Gift card not found');

    const now = new Date();

    if (giftCard.expiresAt < now)
      throw new BadRequestException('Gift card expired');

    if (giftCard.remainingAmount <= 0)
      throw new BadRequestException('Gift card fully redeemed');

    // Redeem fully
    giftCard.remainingAmount = 0;
    giftCard.redeemedAt = now;
    giftCard.status = BusinessGiftCardStatus.USED;

    await this.businessGiftCardRepo.save(giftCard);

    return {
      message: 'Gift card redeemed',
      amountUsed: giftCard.amount,
      redeemedAt: giftCard.redeemedAt,
    };
  }

  /** Stats for user-owned gift cards */
  async getGiftCardStatsByUser(user: User) {
    const total = await this.businessGiftCardRepo.count({
      where: { ownerId: user.id },
    });

    const active = await this.businessGiftCardRepo.count({
      where: { ownerId: user.id, status: BusinessGiftCardStatus.ACTIVE },
    });

    const used = await this.businessGiftCardRepo.count({
      where: { ownerId: user.id, status: BusinessGiftCardStatus.USED },
    });

    return {
      totalOwned: total,
      activeCount: active,
      usedCount: used,
    };
  }

  /** Get all AVAILABLE gift cards */
  async getAllAvailableBusinessGiftCards() {
    return this.businessGiftCardRepo.find({
      where: { soldStatus: BusinessGiftCardSoldStatus.AVAILABLE },
      order: { createdAt: 'DESC' },
    });
  }
}
