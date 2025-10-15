import { GiftCardStatus } from '../../data/enum/gift-card-status.enum';

export class GiftCardResponse {
  id: string;
  code: string;
  name: string;
  status: GiftCardStatus;
  balance: number;
  initialAmount: number;
  description: string;
  expiry?: string;
  recipientName?: string;
  senderName?: string;
  personalMessage?: string;
  createdAt: string;
  updatedAt: string;

}