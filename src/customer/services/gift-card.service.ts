import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GiftCardRepository } from '../data/repository/gift-card.repository';
import { GiftCardTemplateRepository } from '../data/repository/gift-card-template.repository';
import { GiftCard } from '../data/model/gift-card.entity';
import { CreateGiftCardRequest } from '../dtos/request/create-gift-card.request';
import { GiftCardMapper } from '../mapper/gift-card.mapper';
import { RedeemGiftCardRequest } from '../dtos/request/redeem-gift-card-request';
import { GiftCardStatus } from '../data/enum/gift-card-status.enum';
import { GiftCardTemplate } from '../data/model/gift-card-template.entity';

@Injectable()
export class GiftCardService {
  constructor(
    private giftCardRepository: GiftCardRepository,
    private templateRepository: GiftCardTemplateRepository,
  ) {}

  async getAllGiftCards(): Promise<GiftCard[]> {
    return this.giftCardRepository.findAll();
  }

  async getActiveGiftCards(): Promise<GiftCard[]> {
    return this.giftCardRepository.findActive();
  }

  async getGiftCardSummary() {
    const cards = await this.giftCardRepository.findAll();
    return GiftCardMapper.toSummaryResponse(cards);
  }

  async createGiftCard(createDto: CreateGiftCardRequest): Promise<GiftCard> {
    const giftCard = new GiftCard();

    giftCard.code = this.generateGiftCardCode();
    giftCard.initialAmount = createDto.amount;
    giftCard.currentBalance = createDto.amount;
    giftCard.recipientName = createDto.recipientName ?? '';
    giftCard.recipientEmail = createDto.recipientEmail ?? '';
    giftCard.senderName = createDto.senderName ?? '';
    giftCard.personalMessage = createDto.personalMessage ?? '';

    giftCard.expiryDate = new Date();
    giftCard.expiryDate.setFullYear(giftCard.expiryDate.getFullYear() + 3);

    if (createDto.templateId) {
      const template = await this.templateRepository.findById(createDto.templateId);
      if (template) {
        giftCard.template = template;
      }
    }

    return this.giftCardRepository.save(giftCard);
  }

  async redeemGiftCard(redeemDto: RedeemGiftCardRequest): Promise<GiftCard> {
    const giftCard = await this.giftCardRepository.findByCode(redeemDto.code);

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.canBeUsed()) {
      throw new BadRequestException('Gift card cannot be used');
    }

    await this.giftCardRepository.save(giftCard);

    return giftCard;
  }

  async useGiftCardAmount(cardId: string, amount: number): Promise<GiftCard> {
    const giftCard = await this.giftCardRepository.findOne({
      where: { id: cardId }
    });

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.canBeUsed()) {
      throw new BadRequestException('Gift card cannot be used');
    }

    if (giftCard.currentBalance < amount) {
      throw new BadRequestException('Insufficient balance on gift card');
    }

    const newBalance = parseFloat(giftCard.currentBalance.toString()) - amount;
    await this.giftCardRepository.updateBalance(cardId, newBalance);

    giftCard.currentBalance = newBalance;
    if (newBalance === 0) {
      giftCard.status = GiftCardStatus.USED;
    }

    return giftCard;
  }

  async getAvailableTemplates(): Promise<GiftCardTemplate[]> {
    return this.templateRepository.findActiveTemplates();
  }
  async applyGiftCardToBooking(
    giftCardCode: string,
    bookingAmount: number,
  ): Promise<{ updatedGiftCard: GiftCard; remainingToPay: number }> {
    const giftCard = await this.giftCardRepository.findByCode(giftCardCode);

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.canBeUsed()) {
      throw new BadRequestException('Gift card cannot be used');
    }

    if (giftCard.expiryDate && giftCard.expiryDate < new Date()) {
      throw new BadRequestException('Gift card has expired');
    }

    if (giftCard.currentBalance <= 0) {
      throw new BadRequestException('Gift card has no remaining balance');
    }

    const amountToUse =
      giftCard.currentBalance >= bookingAmount
        ? bookingAmount
        : giftCard.currentBalance;

    const newBalance = parseFloat(giftCard.currentBalance.toString()) - amountToUse;

    await this.giftCardRepository.updateBalance(giftCard.id, newBalance);

    giftCard.currentBalance = newBalance;

    if (newBalance === 0) {
      giftCard.status = GiftCardStatus.USED;
    }

    const remainingToPay = bookingAmount - amountToUse;

    return {
      updatedGiftCard: giftCard,
      remainingToPay,
    };
  }
  async validateGiftCard(code: string): Promise<GiftCard> {
    const giftCard = await this.giftCardRepository.findByCode(code);

    if (!giftCard) {
      throw new NotFoundException('Gift card not found');
    }

    if (!giftCard.canBeUsed()) {
      throw new BadRequestException('Gift card is inactive or already used');
    }

    if (giftCard.expiryDate && giftCard.expiryDate < new Date()) {
      throw new BadRequestException('Gift card has expired');
    }

    if (giftCard.currentBalance <= 0) {
      throw new BadRequestException('Gift card has no remaining balance');
    }

    return giftCard;
  }

  private generateGiftCardCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if ((i + 1) % 4 === 0 && i < 11) {
        result += '-';
      }
    }
    return result;
  }
}
