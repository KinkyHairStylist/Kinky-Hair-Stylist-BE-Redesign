// import { GiftCardService } from '../services/gift-card.service.impl';
// import { GiftCard } from '../data/model/gift-card.model';
// import { GiftCardStatus } from '../data/enum/gift-card-status.enum';
// import { PurchaseGiftCardRequest } from '../dtos/request/purchase-gift-card.request';
// import { RedeemGiftCardRequest } from '../dtos/request/redeem-gift-card-request';
// import type { IGiftCardRepository } from '../data/repository/gift-card.repository';
//
// // Response DTO stubs (make sure these match your real ones)
// interface PurchaseGiftCardResponse {
//   success: boolean;
//   message: string;
//   code?: string;
// }
//
// interface RedeemGiftCardResponse {
//   success: boolean;
//   message: string;
//   balance?: number;
// }
//
// interface ValidateGiftCardResponse {
//   success: boolean;
//   message: string;
//   code?: string;
// }
//
// interface ApplyGiftCardResponse {
//   success: boolean;
//   message: string;
//   appliedAmount?: number;
//   remainingBookingAmount?: number;
// }
//
// describe('GiftCardService', () => {
//   let service: GiftCardService;
//   let giftCardRepository: jest.Mocked<IGiftCardRepository>;
//
//   beforeEach(() => {
//     giftCardRepository = {
//       create: jest.fn(),
//       findByCode: jest.fn(),
//       update: jest.fn(),
//       updateStatus: jest.fn(),
//       findByStatus: jest.fn(),
//       findAll: jest.fn(),
//       exists: jest.fn(),
//     } as unknown as jest.Mocked<IGiftCardRepository>;
//
//     // Bind all methods to avoid unbound-method ESLint warnings
//     service = new GiftCardService(giftCardRepository);
//     Object.getOwnPropertyNames(Object.getPrototypeOf(service)).forEach(key => {
//       const val = (service as any)[key];
//       if (typeof val === 'function') (service as any)[key] = val.bind(service);
//     });
//   });
//
//   describe('purchaseGiftCard', () => {
//     it('returns error when amount <= 0', async () => {
//       const req = new PurchaseGiftCardRequest(0, 'USD', 10);
//       const res = (await service.purchaseGiftCard(req)) as PurchaseGiftCardResponse;
//
//       expect(res.success).toBe(false);
//       expect(res.message).toContain('greater than 0');
//     });
//
//     it('creates and returns a gift card successfully', async () => {
//       jest.spyOn(service as any, 'generateUniqueGiftCardCode').mockResolvedValue('TEST1234');
//       const fakeCard = GiftCard.create('TEST1234', 100, 'USD', new Date());
//       giftCardRepository.create.mockResolvedValue(fakeCard);
//
//       const req = new PurchaseGiftCardRequest(100, 'USD', 10);
//       const res = (await service.purchaseGiftCard(req)) as PurchaseGiftCardResponse;
//
//       expect(res.success).toBe(true);
//       expect(res.code).toBe('TEST1234');
//       expect(res.message).toContain('purchased');
//     });
//   });
//
//   describe('redeemGiftCard', () => {
//     it('returns error when amount <= 0', async () => {
//       const req = new RedeemGiftCardRequest('CODE123', 0);
//       const res = (await service.redeemGiftCard(req)) as RedeemGiftCardResponse;
//
//       expect(res.success).toBe(false);
//       expect(res.message).toContain('greater than 0');
//     });
//
//     it('redeems a valid gift card', async () => {
//       const giftCard = GiftCard.create('CARDX', 100, 'USD', new Date(Date.now() + 86400000));
//       jest.spyOn(giftCard, 'redeem').mockImplementation(() => (giftCard.balance = 50));
//       giftCardRepository.findByCode.mockResolvedValue(giftCard);
//       giftCardRepository.update.mockResolvedValue(giftCard);
//
//       const req = new RedeemGiftCardRequest('CARDX', 50);
//       const res = (await service.redeemGiftCard(req)) as RedeemGiftCardResponse;
//
//       expect(res.success).toBe(true);
//       expect(res.balance).toBe(50);
//       expect(res.message).toContain('redeemed');
//     });
//   });
//
//   describe('validateGiftCard', () => {
//     it('marks expired cards as expired', async () => {
//       const expired = GiftCard.create('OLD123', 100, 'USD', new Date(Date.now() - 86400000));
//       jest.spyOn(expired, 'validate').mockReturnValue({ isValid: false, error: 'expired' });
//       giftCardRepository.findByCode.mockResolvedValue(expired);
//       giftCardRepository.updateStatus.mockResolvedValue(expired);
//
//       const res = (await service.validateGiftCard('OLD123')) as ValidateGiftCardResponse;
//
//       expect(res.success).toBe(true);
//       expect(giftCardRepository.updateStatus).toHaveBeenCalledWith(expired.id, GiftCardStatus.EXPIRED);
//     });
//
//     it('validates active cards', async () => {
//       const active = GiftCard.create('LIVE123', 100, 'USD', new Date(Date.now() + 86400000));
//       jest.spyOn(active, 'validate').mockReturnValue({ isValid: true });
//       giftCardRepository.findByCode.mockResolvedValue(active);
//
//       const res = (await service.validateGiftCard('LIVE123')) as ValidateGiftCardResponse;
//
//       expect(res.success).toBe(true);
//       expect(res.code).toBe('LIVE123');
//       expect(res.message).toContain('valid');
//     });
//   });
//
//   describe('applyGiftCardToBooking', () => {
//     it('returns error when booking amount is invalid', async () => {
//       const res = (await service.applyGiftCardToBooking(0, 'CODE123')) as ApplyGiftCardResponse;
//       expect(res.success).toBe(false);
//       expect(res.message).toContain('Invalid booking amount');
//     });
//
//     it('applies partial gift card to booking', async () => {
//       const giftCard = GiftCard.create('BOOK123', 50, 'USD', new Date(Date.now() + 86400000));
//       jest.spyOn(giftCard, 'validate').mockReturnValue({ isValid: true });
//       jest.spyOn(giftCard, 'redeem').mockImplementation(() => (giftCard.balance = 0));
//       giftCardRepository.findByCode.mockResolvedValue(giftCard);
//       giftCardRepository.update.mockResolvedValue(giftCard);
//
//       const res = (await service.applyGiftCardToBooking(100, 'BOOK123')) as ApplyGiftCardResponse;
//
//       expect(res.success).toBe(true);
//       expect(res.appliedAmount).toBe(50);
//       expect(res.remainingBookingAmount).toBe(50);
//       expect(res.message).toContain('applied');
//     });
//   });
//
//   describe('expireOldGiftCards', () => {
//     it('expires old active cards', async () => {
//       const gc = GiftCard.create('EXPIRE1', 100, 'USD', new Date(Date.now() - 86400000));
//       jest.spyOn(gc, 'isExpired').mockReturnValue(true);
//       giftCardRepository.findByStatus.mockResolvedValue([gc]);
//       giftCardRepository.updateStatus.mockResolvedValue(gc);
//
//       const res = await service.expireOldGiftCards();
//
//       expect(res.expiredCount).toBe(1);
//       expect(giftCardRepository.updateStatus).toHaveBeenCalledWith(gc.id, GiftCardStatus.EXPIRED);
//     });
//   });
// });
