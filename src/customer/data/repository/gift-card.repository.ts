import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GiftCard } from '../model/gift-card.entity';
import { GiftCardStatus } from '../enum/gift-card-status.enum';

@Injectable()
export class GiftCardRepository extends Repository<GiftCard> {
  constructor(private dataSource: DataSource) {
    super(GiftCard, dataSource.createEntityManager());
  }

  async findAll(): Promise<GiftCard[]> {
    return this.createQueryBuilder('giftCard')
      .leftJoinAndSelect('giftCard.template', 'template')
      .orderBy('giftCard.createdAt', 'DESC')
      .getMany();
  }

  async findByCode(code: string): Promise<GiftCard | null> {
    return this.createQueryBuilder('giftCard')
      .leftJoinAndSelect('giftCard.template', 'template')
      .where('giftCard.code = :code', { code })
      .getOne();
  }

  async findActive(): Promise<GiftCard[]> {
    return this.createQueryBuilder('giftCard')
      .leftJoinAndSelect('giftCard.template', 'template')
      .where('giftCard.status = :status', { status: GiftCardStatus.ACTIVE })
      .andWhere('giftCard.currentBalance > 0')
      .andWhere('(giftCard.expiryDate IS NULL OR giftCard.expiryDate > NOW())')
      .getMany();
  }


  async updateStatus(id: string, status: GiftCardStatus): Promise<void> {
    await this.update(id, { status });
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    await this.update(id, {
      currentBalance: newBalance,
      status: newBalance === 0 ? GiftCardStatus.USED : GiftCardStatus.ACTIVE
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.update(id, {
      status: GiftCardStatus.USED,
      currentBalance: 0,
      usedAt: new Date()
    });
  }
}