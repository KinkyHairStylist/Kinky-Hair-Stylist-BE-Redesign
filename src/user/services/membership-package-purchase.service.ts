import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { MerchantMembershipPackage } from 'src/business/entities/merchant-membership-package.entity';
import {
  MerchantMembershipPurchase,
  MerchantMembershipPurchaseStatus,
} from 'src/business/entities/merchant-membership-purchase.entity';
import { User } from 'src/all_user_entities/user.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
} from 'src/business/entities/transaction.entity';
import { WalletCurrency } from 'src/admin/payment/enums/wallet.enum';
import { StripeService } from 'src/payment/stripe.service';
import { PurchaseMembershipPackageDto } from '../dtos/membership-package.dto';

@Injectable()
export class MembershipPackagePurchaseService {
  constructor(
    @InjectRepository(MerchantMembershipPackage)
    private readonly packageRepo: Repository<MerchantMembershipPackage>,
    @InjectRepository(MerchantMembershipPurchase)
    private readonly purchaseRepo: Repository<MerchantMembershipPurchase>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly dataSource: DataSource,
    private readonly stripeService: StripeService,
  ) {}

  // ------------------------------------------------------
  // Step 1 — Initialize purchase via Stripe. No purchase row is created
  // here — the full session-count is only granted once the PaymentIntent
  // is confirmed succeeded, via completePurchase() below. No commission
  // is taken at this stage: the full amount enters the prepaid pool, and
  // KHS's 12%-equivalent commission is only skimmed per-session at
  // redemption time (see booking.service.ts's confirmBooking).
  // ------------------------------------------------------
  async initPurchase(packageId: string, dto: PurchaseMembershipPackageDto, purchaser: User) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId },
      relations: ['business'],
    });
    if (!pkg) throw new NotFoundException('Membership package not found');
    if (!pkg.isActive) throw new BadRequestException('Membership package is no longer available');

    const amount = Number(pkg.pricePerSession) * pkg.sessionCount;

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customerEmail: purchaser.email,
      metadata: {
        packageId: pkg.id,
        purchaserId: purchaser.id,
        cardId: dto.cardId ?? '',
      },
    });

    const reference = paymentIntent.id;

    const purchaseTx = this.transactionRepo.create({
      senderId: purchaser.id,
      recipientId: pkg.business?.ownerId,
      amount,
      type: TransactionType.DEBIT,
      currency: WalletCurrency.USD,
      description: `Purchase of membership package (${pkg.sessionCount} sessions)`,
      mode: 'Web',
      referenceId: reference,
      status: TransactionStatus.PENDING,
      method: PaymentMethod.STRIPE,
      service: 'Membership-Purchase',
      customerName: `${purchaser.firstName} ${purchaser.surname}`,
    });
    await this.transactionRepo.save(purchaseTx);

    return {
      message: 'Payment initialized',
      amount,
      sessionCount: pkg.sessionCount,
      clientSecret: paymentIntent.client_secret,
      reference,
    };
  }

  // ------------------------------------------------------
  // Step 2 — Verify the PaymentIntent succeeded, then create the actual
  // MerchantMembershipPurchase row. Idempotent: a purchase row already
  // existing for this stripePaymentIntentId means a prior call (FE retry)
  // already completed it.
  // ------------------------------------------------------
  async completePurchase(reference: string, purchaser: User) {
    const existing = await this.purchaseRepo.findOne({
      where: { stripePaymentIntentId: reference },
    });
    if (existing) {
      return { message: 'Membership purchase already completed', purchase: existing, alreadyCompleted: true };
    }

    const intent = await this.stripeService.retrievePaymentIntent(reference);
    const meta = (intent?.metadata ?? {}) as Record<string, string>;

    if (!intent || intent.status !== 'succeeded') {
      await this.transactionRepo.update(
        { referenceId: reference, service: 'Membership-Purchase' },
        { status: TransactionStatus.FAILED },
      );
      throw new BadRequestException('Payment verification failed');
    }

    const pkg = await this.packageRepo.findOne({ where: { id: meta.packageId } });
    if (!pkg) throw new NotFoundException('Membership package not found');

    const purchasedAt = new Date();
    const expiresAt = new Date(purchasedAt);
    expiresAt.setDate(expiresAt.getDate() + pkg.expiryDays);

    const purchase = await this.dataSource.manager.transaction(async (manager) => {
      const row = manager.create(MerchantMembershipPurchase, {
        packageId: pkg.id,
        businessId: pkg.businessId,
        clientId: purchaser.id,
        remainingSessions: pkg.sessionCount,
        purchasedAt,
        expiresAt,
        status: MerchantMembershipPurchaseStatus.ACTIVE,
        stripePaymentIntentId: reference,
      });
      const saved = await manager.save(MerchantMembershipPurchase, row);

      await manager.update(
        Transaction,
        { referenceId: reference, service: 'Membership-Purchase' },
        { status: TransactionStatus.COMPLETED },
      );

      return saved;
    });

    return { message: 'Membership purchase completed successfully', purchase };
  }

  async getOwnedPurchases(clientId: string) {
    return this.purchaseRepo.find({
      where: { clientId },
      relations: ['package', 'package.service'],
      order: { createdAt: 'DESC' },
    });
  }

  async listPackagesForBusiness(businessId: string) {
    return this.packageRepo.find({
      where: { businessId, isActive: true },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }
}
