import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { BusinessGiftCard } from 'src/business/entities/business-giftcard.entity';
import { Card } from 'src/all_user_entities/card.entity';
import { User } from 'src/all_user_entities/user.entity';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from 'src/business/entities/transaction.entity';
// import { BusinessWalletService } from 'src/business/services/wallet.service';
import { PaystackService } from 'src/payment/paystack.service';
import { PurchaseBusinessGiftCardDto, RedeemGiftCardDto, ValidateGiftCardDto } from '../dtos/create-gift-card.dto';
import { BusinessGiftCardSoldStatus, BusinessGiftCardStatus } from 'src/business/enum/gift-card.enum';

@Injectable()
export class GiftCardService {
  constructor(
    @InjectRepository(BusinessGiftCard)
    private readonly giftCardRepo: Repository<BusinessGiftCard>,

    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,

    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,

    private readonly dataSource: DataSource,
    // private readonly walletService: BusinessWalletService,
    private readonly paystack: PaystackService,
  ) {}

  // ------------------------------------------------------
  // Step 1 — Initialize Purchase (Creates PENDING transaction)
  // ------------------------------------------------------
  async purchaseGiftCard(dto: PurchaseBusinessGiftCardDto, purchaser: User) {
    const giftCard = await this.giftCardRepo.findOne({
      where: { id: dto.businessGiftCardId },
      relations: ['owner'],
    });

    if (!giftCard) throw new NotFoundException('Gift card not found');
    if (!giftCard.owner) throw new BadRequestException('Business has no owner');
    if (giftCard.soldStatus !== BusinessGiftCardSoldStatus.AVAILABLE)
      throw new BadRequestException('Gift card already purchased');

    const card = await this.cardRepo.findOne({
      where: { id: dto.cardId },
      relations: ['user'],
    });

    if (!card) throw new NotFoundException('Payment card not found');
    if (card.user.id !== purchaser.id)
      throw new ForbiddenException('You cannot use this payment method');

    // Initialize Paystack payment
    const init = await this.paystack.initializePayment({
      email: purchaser.email,
      amount: Number(giftCard.amount) * 100,
      metadata: {
        giftCardId: giftCard.id,
        purchaserId: purchaser.id,
        cardId: dto.cardId,
      },
    });

    if (!init?.reference)
      throw new BadRequestException('Unable to initialize payment');

    // UPDATE GIFT CARD OWNERSHIP & DETAILS
    giftCard.soldStatus = BusinessGiftCardSoldStatus.PENDING;
    giftCard.status = BusinessGiftCardStatus.ACTIVE;
    giftCard.remainingAmount = Number(giftCard.amount);

    // Recipient is from DTO
    giftCard.recipientName = dto.recipientName ?? 'No name provided';
    giftCard.recipientEmail = dto.recipientEmail ?? 'No Email provided';

    // Sender is from DTO (fullName), fallback to purchaser name if missing
    giftCard.senderName = dto.fullName ?? `${purchaser.firstName} ${purchaser.surname}`;

    // The buyer becomes the OWNER
    giftCard.ownerId = purchaser.id;
    giftCard.ownerEmail = purchaser.email;
    giftCard.ownerFullName = `${purchaser.firstName} ${purchaser.surname}`;

    giftCard.cardId = dto.cardId ?? undefined;

    await this.giftCardRepo.save(giftCard);

    // Save pending transaction
    const tx = this.transactionRepo.create({
      senderId: purchaser.id,
      recipientId: giftCard.owner.id,
      amount: giftCard.amount,
      type: TransactionType.DEBIT,
      currency: giftCard.currency as any,
      description: `Purchase of gift card "${giftCard.title}"`,
      mode: 'Web',
      referenceId: init.reference,
      status: TransactionStatus.PENDING,
      method: PaymentMethod.PAYSTACK,
      service: 'GiftCard-Purchase',
      customerName: `${purchaser.firstName} ${purchaser.surname}`,
    });

    await this.transactionRepo.save(tx);

    return {
      message: 'Payment initialized',
      authorizationUrl: init.authorization_url,
      reference: init.reference,
    };
  }

  // ------------------------------------------------------
  // Step — Complete Purchase (Verify Payment & Save Transaction)
  // ------------------------------------------------------
  async completeGiftCardPurchase(reference: string) {
    // Verify payment
    const verification = await this.paystack.verifyPayment(reference);

    if (!verification || verification.status !== 'success') {
      await this.transactionRepo.update(
        { referenceId: reference },
        { status: TransactionStatus.FAILED },
      );
      throw new BadRequestException('Payment verification failed');
    }

    const meta = verification.metadata;

    // Start DB transaction
    return await this.dataSource.manager.transaction(async (manager) => {
      // Find gift card
      const giftCard = await manager.findOne(BusinessGiftCard, {
        where: { id: meta.giftCardId },
        relations: ['business'],
      });
      if (!giftCard) throw new NotFoundException('Gift card not found');
      if (giftCard.soldStatus !== BusinessGiftCardSoldStatus.AVAILABLE)
        throw new BadRequestException('Gift card already purchased');

      // Find purchaser
      const purchaser = await manager.findOne(User, { where: { id: meta.purchaserId } });
      if (!purchaser) throw new NotFoundException('Purchaser not found');

      // Assign gift card
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + giftCard.expiryInDays);

      giftCard.ownerId = purchaser.id;
      giftCard.ownerEmail = purchaser.email;
      giftCard.ownerFullName = `${purchaser.firstName} ${purchaser.surname}`;
      giftCard.cardId = meta.cardId ?? null;
      giftCard.soldStatus = BusinessGiftCardSoldStatus.PURCHASED;
      giftCard.expiresAt = expiry;

      await manager.save(BusinessGiftCard, giftCard);

      // Update business wallet
      // await this.walletService.addFunds({
      //   businessId: giftCard.businessId,
      //   amount: Number(verification.amount),
      //   type: 'credit',
      //   description: `Gift card purchase via Paystack`,
      //   referenceId: reference,
      // });

      // Complete transaction
      const tx = this.transactionRepo.create({
        senderId: purchaser.id,
        recipientId: giftCard.business.ownerId,
        amount: giftCard.amount,
        type: TransactionType.EARNING,
        currency: giftCard.currency as any,
        description: `Purchased gift card "${giftCard.title}"`,
        mode: 'Web',
        referenceId: reference,
        status: TransactionStatus.COMPLETED,
        method: PaymentMethod.PAYSTACK,
        service: 'GiftCard-Purchase',
        customerName: `${purchaser.firstName} ${purchaser.surname}`,
      });

      await manager.save(Transaction, tx);

      return {
        message: 'Gift card purchase completed successfully',
        giftCard,
        transaction: tx,
      };
    });
  }

  // ------------------------------------------------------
  // 🔎 Validate Gift Card
  // ------------------------------------------------------
  async validateGiftCard(dto: ValidateGiftCardDto) {
    const giftCard = await this.giftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard) throw new NotFoundException('Gift card not found');

    const now = new Date();

    if (giftCard.expiresAt < now)
      return { valid: false, reason: 'Gift card expired' };
    if (giftCard.soldStatus !== BusinessGiftCardSoldStatus.PURCHASED)
      return { valid: false, reason: 'Gift card not purchased' };
    if (giftCard.remainingAmount <= 0)
      return { valid: false, reason: 'Gift card fully redeemed' };

    return {
      valid: true,
      amount: giftCard.remainingAmount,
      expiresAt: giftCard.expiresAt,
      status: giftCard.status,
    };
  }

  // ------------------------------------------------------
  // ✔ Redeem Gift Card (logs transaction)
  // ------------------------------------------------------
  async redeemGiftCard(dto: RedeemGiftCardDto, user: User) {
    const giftCard = await this.giftCardRepo.findOne({
      where: { code: dto.code },
    });

    if (!giftCard) throw new NotFoundException('Gift card not found');

    const now = new Date();

    if (giftCard.expiresAt < now)
      throw new BadRequestException('Gift card expired');
    if (giftCard.remainingAmount <= 0)
      throw new BadRequestException('Gift card fully redeemed');

    const amount = Number(giftCard.remainingAmount);

    // Redeem inside a transaction
    return await this.dataSource.manager.transaction(async (manager) => {
      giftCard.remainingAmount = 0;
      giftCard.redeemedAt = now;
      giftCard.status = BusinessGiftCardStatus.USED;

      await manager.save(BusinessGiftCard, giftCard);

      // Log redemption transaction
      const tx = this.transactionRepo.create({
        senderId: giftCard.ownerId,
        recipientId: user.id,
        amount,
        type: TransactionType.EARNING,
        currency: giftCard.currency as any,
        description: `Redeemed gift card "${giftCard.title}"`,
        mode: 'System',
        referenceId: giftCard.code,
        status: TransactionStatus.COMPLETED,
        method: PaymentMethod.GIFTCARD,
        service: 'GiftCard-Redemption',
      });

      await manager.save(Transaction, tx);

      return {
        message: 'Gift card redeemed',
        amountUsed: amount,
        redeemedAt: giftCard.redeemedAt,
      };
    });
  }

  /** Stats for user-owned gift cards */
  async getGiftCardStatsByUser(user: User) {
    const total = await this.giftCardRepo.count({ where: { ownerId: user.id } });
    const active = await this.giftCardRepo.count({ where: { ownerId: user.id, status: BusinessGiftCardStatus.ACTIVE } });
    const used = await this.giftCardRepo.count({ where: { ownerId: user.id, status: BusinessGiftCardStatus.USED } });

    return { totalOwned: total, activeCount: active, usedCount: used };
  }

  /** Get all AVAILABLE gift cards */
  async getAllAvailableBusinessGiftCards() {
    return this.giftCardRepo.find({
      where: {
        soldStatus: BusinessGiftCardSoldStatus.AVAILABLE,
        status: BusinessGiftCardStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
