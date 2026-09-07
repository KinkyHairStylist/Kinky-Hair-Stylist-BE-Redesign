import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  MerchantSubscription,
  MerchantSubscriptionStatus,
} from '../entities/merchant-subscription.entity';
import { Business, BusinessStatus } from '../entities/business.entity';
import { StripeService } from '../../payment/stripe.service';
import { EmailService } from '../../email/email.service';

const TRIAL_DAYS = 14;

@Injectable()
export class MerchantSubscriptionService {
  private readonly logger = new Logger(MerchantSubscriptionService.name);

  constructor(
    @InjectRepository(MerchantSubscription)
    private readonly merchantSubscriptionRepo: Repository<MerchantSubscription>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
  ) {}

  // Called from admin approveApplication. Idempotent — a reject→reapprove
  // cycle must not grant a second free trial, so an existing row for this
  // business is returned unchanged rather than recreated.
  //
  // `manager`: when the caller is already inside a DB transaction (so the
  // business-status save and this subscription insert commit or roll back
  // together), pass its EntityManager here. The Stripe Customer API call
  // itself always happens first, outside any transaction — it can't
  // participate in one, and an orphaned Stripe Customer if the later DB
  // write fails is an accepted, low-cost edge case.
  async startTrialForBusiness(
    business: Business,
    manager?: EntityManager,
  ): Promise<MerchantSubscription> {
    const repo = manager
      ? manager.getRepository(MerchantSubscription)
      : this.merchantSubscriptionRepo;

    const existing = await repo.findOne({ where: { businessId: business.id } });
    if (existing) {
      this.logger.log(
        `Business ${business.id} already has a subscription record (status: ${existing.status}) — skipping trial creation.`,
      );
      return existing;
    }

    const stripeCustomer = await this.stripeService.createCustomerForBusiness({
      businessId: business.id,
      email: business.ownerEmail,
      name: business.businessName,
    });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const subscription = repo.create({
      businessId: business.id,
      status: MerchantSubscriptionStatus.TRIALING,
      trialEndsAt,
      stripeCustomerId: stripeCustomer.id,
    });
    return repo.save(subscription);
  }

  // Used by unsuspendBusiness — the uniform gate: approved must always
  // imply an active subscription, regardless of why the business was
  // suspended in the first place.
  async hasActiveOrTrialingSubscription(businessId: string): Promise<boolean> {
    const sub = await this.merchantSubscriptionRepo.findOne({ where: { businessId } });
    if (!sub) return false;
    if (sub.status === MerchantSubscriptionStatus.ACTIVE) return true;
    if (sub.status === MerchantSubscriptionStatus.TRIALING) {
      return !sub.trialEndsAt || sub.trialEndsAt > new Date();
    }
    return false;
  }

  // Read-only status for the merchant's own billing/trial-banner UI.
  async getStatusForBusiness(business: Business): Promise<{
    status: MerchantSubscriptionStatus | null;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    planTier: string;
    // A card can be attached mid-trial (status stays TRIALING until the
    // trial actually ends) — without this, the frontend can't tell "no
    // card yet" from "already subscribed, still trialing" from status alone.
    hasPaymentMethod: boolean;
  }> {
    const sub = await this.merchantSubscriptionRepo.findOne({
      where: { businessId: business.id },
    });
    return {
      status: sub?.status ?? null,
      trialEndsAt: sub?.trialEndsAt ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      hasPaymentMethod: !!sub?.stripeSubscriptionId,
      planTier: business.planTier,
    };
  }

  // ---- Merchant-facing: attach a card and start real Stripe billing ----

  async createSetupIntentForBusiness(businessId: string) {
    const sub = await this.merchantSubscriptionRepo.findOne({ where: { businessId } });
    if (!sub?.stripeCustomerId) {
      throw new Error('No Stripe customer on file for this business — approval must run first.');
    }
    return this.stripeService.createSetupIntent(sub.stripeCustomerId);
  }

  // trial_end: pass the existing trialEndsAt if still in the future (so a
  // merchant adding a card mid-trial isn't charged immediately), else
  // 'now' — a win-back path for a merchant re-subscribing post-expiry.
  async attachPaymentMethodAndSubscribe(
    businessId: string,
    paymentMethodId: string,
    stripePriceId: string,
  ): Promise<MerchantSubscription> {
    const sub = await this.merchantSubscriptionRepo.findOne({ where: { businessId } });
    if (!sub?.stripeCustomerId) {
      throw new Error('No Stripe customer on file for this business — approval must run first.');
    }

    await this.stripeService.attachPaymentMethodAsDefault(sub.stripeCustomerId, paymentMethodId);

    const trialEnd: number | 'now' =
      sub.trialEndsAt && sub.trialEndsAt > new Date()
        ? Math.floor(sub.trialEndsAt.getTime() / 1000)
        : 'now';

    const stripeSubscription = await this.stripeService.createSubscription(
      sub.stripeCustomerId,
      stripePriceId,
      trialEnd,
    );

    sub.stripeSubscriptionId = stripeSubscription.id;
    return this.merchantSubscriptionRepo.save(sub);
  }

  // ---- Stripe webhook handlers — thin, idempotent, log not throw ----

  async handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
    const sub = await this.merchantSubscriptionRepo.findOne({
      where: { stripeSubscriptionId },
    });
    if (!sub) return;
    sub.status = MerchantSubscriptionStatus.CANCELED;
    sub.cancelReason = 'stripe_canceled';
    await this.merchantSubscriptionRepo.save(sub);

    // Approved must always imply an active subscription — mirrors the
    // cron sweep's suspendForBilling, kept idempotent alongside it.
    const business = await this.businessRepo.findOne({ where: { id: sub.businessId } });
    if (!business || business.status === BusinessStatus.SUSPENDED) return;

    business.status = BusinessStatus.SUSPENDED;
    await this.businessRepo.save(business);

    try {
      this.emailService.sendMerchantSubscriptionLapsedEmail(
        business.ownerEmail || '',
        business.businessName,
        'stripe_canceled',
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription-lapsed email for business ${business.id}: ${error.message}`,
      );
    }
  }

  async handlePaymentFailed(stripeSubscriptionId: string): Promise<void> {
    const sub = await this.merchantSubscriptionRepo.findOne({
      where: { stripeSubscriptionId },
    });
    if (!sub) return;
    // Don't reset the grace-period clock on Stripe's own repeated retries
    // of the same invoice — only set pastDueSince the first time.
    if (sub.status !== MerchantSubscriptionStatus.PAST_DUE) {
      sub.pastDueSince = new Date();
    }
    sub.status = MerchantSubscriptionStatus.PAST_DUE;
    await this.merchantSubscriptionRepo.save(sub);
  }

  async handlePaymentSucceeded(
    stripeSubscriptionId: string,
    currentPeriodEnd: Date,
  ): Promise<void> {
    const sub = await this.merchantSubscriptionRepo.findOne({
      where: { stripeSubscriptionId },
    });
    if (!sub) return;
    sub.status = MerchantSubscriptionStatus.ACTIVE;
    sub.pastDueSince = null;
    sub.currentPeriodEnd = currentPeriodEnd;
    await this.merchantSubscriptionRepo.save(sub);
  }
}
