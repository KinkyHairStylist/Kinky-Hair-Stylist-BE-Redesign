import { GiftCard } from '../data/model/gift-card.entity';
import { GiftCardResponse } from '../dtos/response/gift-card.response';
import { GiftCardTemplate } from '../data/model/gift-card-template.entity';
import { GiftCardTemplateResponse } from '../dtos/response/gift-card-template.response';
import { GiftCardSummaryResponse } from '../dtos/response/gift-card-summary.response';
import { GiftCardStatus } from '../data/enum/gift-card-status.enum';

export class GiftCardMapper {
  static toGiftCardResponse(card: GiftCard): GiftCardResponse {
    return {
      id: card.id,
      code: card.code,
      name: card.template?.name || 'Custom Gift Card',
      status: card.status,
      balance: parseFloat(card.currentBalance.toString()),
      initialAmount: parseFloat(card.initialAmount.toString()),
      description: card.template?.description || 'A wonderful gift experience',
      expiry: card.expiryDate ? this.formatDate(card.expiryDate) : undefined,
      recipientName: card.recipientName,
      senderName: card.senderName,
      personalMessage: card.personalMessage,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }

  static toGiftCardTemplateResponse(template: GiftCardTemplate): GiftCardTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      imageUrl: template.imageUrl,
      price: `AUD $${template.fixedAmount || 'Custom'}`,
      color: template.colorGradient,
      amountOptions: template.amountOptions,
    };
  }

  static toSummaryResponse(cards: GiftCard[]): GiftCardSummaryResponse {
    const totalBalance = cards
      .filter(card => card.status === GiftCardStatus.ACTIVE)
      .reduce((sum, card) => sum + parseFloat(card.currentBalance.toString()), 0);

    const activeCards = cards.filter(card => card.status === GiftCardStatus.ACTIVE).length;
    const usedCards = cards.filter(card => card.status === GiftCardStatus.USED).length;
    const expiredCards = cards.filter(card => card.status === GiftCardStatus.EXPIRED).length;

    return {
      totalBalance,
      activeCards,
      usedCards,
      expiredCards,
    };
  }

  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(',', '');
  }
}