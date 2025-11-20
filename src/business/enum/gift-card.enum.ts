export enum BusinessGiftCardStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  USED = 'Used',
  EXPIRED = 'Expired',
  DELETED = 'deleted',
}

export enum BusinessGiftCardSoldStatus {
  AVAILABLE = 'available', 
  PURCHASED = 'purchased'
}

export enum BusinessSentStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export enum BusinessGiftCardTemplate {
  VALENTINE = 'valentine',
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  GENERAL = 'general',
  MOTHERS = 'mothers',
  FATHERS = 'fathers',
  CHRISTMAS = 'christmas',
  WEDDING = 'wedding',
  GRADUATION = 'graduation',
}
