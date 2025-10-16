// Create src/business/types/address.types.ts
export interface Address {
  addressName: string;
  addressLine1: string;
  addressLine2?: string;
  location: string;
  city?: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
}