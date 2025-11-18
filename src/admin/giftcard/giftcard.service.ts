import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard, GiftCardStatus } from '../../all_user_entities/gift-card.entity';
import { CreateGiftCardDto } from './dto/create-giftcard.dto';
import { GiftCardSummaryDto } from './dto/giftcard-summary.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class GiftcardService {
  constructor(
    @InjectRepository(GiftCard)
    private readonly giftCardRepo: Repository<GiftCard>,
  ) {}

  async getSummary(): Promise<GiftCardSummaryDto> {
    const totalAmount = await this.giftCardRepo
      .createQueryBuilder('giftcard')
      .select('SUM(giftcard.amount)', 'sum')
      .getRawOne();

    const activeCount = await this.giftCardRepo.count({
      where: { status: GiftCardStatus.ACTIVE },
    });

    const usedCount = await this.giftCardRepo.count({
      where: { status: GiftCardStatus.USED },
    });

    const expiredCount = await this.giftCardRepo.count({
      where: { status: GiftCardStatus.EXPIRED },
    });

    const inactiveCount = await this.giftCardRepo.count({
      where: { status: GiftCardStatus.INACTIVE },
    });

    return {
      totalAmount: Number(totalAmount.sum) || 0,
      activeCount,
      usedCount,
      expiredCount,
      inactiveCount,
    };
  }

  // Issue new gift card
  async issueGiftCard(dto: CreateGiftCardDto) {
    // Let the entity handle currentBalance default via @BeforeInsert
    const giftCard = this.giftCardRepo.create({
      senderName: dto.purchaser.name,
      recipientName: dto.recipient.name,
      recipientEmail: dto.recipient.email,
      amount: dto.originalValue,
      business: { id: dto.business } as any,
      expiresAt: new Date(dto.expiryDate),
      purchaseDate: new Date().toISOString().split('T')[0],
      status: GiftCardStatus.ACTIVE,
    });

    const saved = await this.giftCardRepo.save(giftCard);

    return {
      message: 'Gift card issued successfully.',
      giftCard: saved,
    };
  }

  // Get all gift cards
  async findAll() {
    const cards = await this.giftCardRepo.find();
    return {
      message: `Found ${cards.length} gift card(s).`,
      total: cards.length,
      data: cards,
    };
  }

  // Get one gift card
  async findOne(identifier: string) {
    const giftCard = await this.giftCardRepo.findOne({
      where: [{ code: identifier }],
    });

    if (!giftCard)
      throw new NotFoundException(`Gift card not found for ID/code: ${identifier}`);

    return {
      message: 'Gift card fetched successfully.',
      data: giftCard,
    };
  }

  // Deactivate a gift card
  async deactivateGiftCard(id: string, reason: string) {
    const result = await this.giftCardRepo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Gift card not found.');

    if (result.status !== GiftCardStatus.ACTIVE) {
      throw new BadRequestException('Gift card is already inactive or used.');
    }

    result.status = GiftCardStatus.INACTIVE;
    result.comment = reason; // Save reason into comment field
    result.usedAt = new Date();
    await this.giftCardRepo.save(result);

    return {
      message: `Gift card (${result.code}) has been deactivated.`,
      data: result,
    };
  }

  // process refund
  async refundGiftCard(id: string, amount: number, reason: string) {
  const giftCard = await this.giftCardRepo.findOne({ where: { id } });
  if (!giftCard) throw new NotFoundException('Gift card not found.');

  if (giftCard.status !== GiftCardStatus.ACTIVE) {
    throw new BadRequestException('Gift card is not active. Cannot refund.');
  }

  giftCard.currentBalance = amount;
  giftCard.comment = reason; // Save reason into comment field

  const updated = await this.giftCardRepo.save(giftCard);

  return {
    message: `Refund of ${amount} applied successfully to card (${giftCard.code}).`,
    updatedBalance: updated.currentBalance,
    data: updated,
  };
}

  // Get usage history
  async getUsageHistory(id: string) {
    const giftCard = await this.giftCardRepo.findOne({ where: { id } });
    if (!giftCard) throw new NotFoundException('Gift card not found.');

    return {
      message: `Usage history for gift card (${giftCard.code}) retrieved successfully.`,
      data: {
        lastUsedDate: giftCard.usedAt,
        note: 'Transactions feature not yet implemented.',
      },
    };
  }

  // Delete all gift cards
  async deleteAllGiftCards() {
    const result = await this.giftCardRepo.clear();
    return {
      message: 'All gift cards have been permanently deleted.',
      result,
    };
  }
}
