// src/business/types/client.types.ts

export interface ClientProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: string;
  pronouns?: string;
  occupation?: string;
  clientSource: string;
  profileImage?: string;
}

export interface ClientAddress {
  addressName: string;
  addressLine1: string;
  addressLine2?: string;
  location: string;
  city?: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary?: boolean;
}

export interface EmergencyContact {
  firstName: string;
  lastName: string;
  email: string;
  relationship: string;
  phone: string;
}

export interface ClientPreferences {
  preferredContactMethod?: string;
  language?: string;
  timezone?: string;
}

export interface ClientSettings {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  clientType?: 'regular' | 'vip' | 'new';
  notes?: string;
  preferences?: ClientPreferences;
}

export interface ClientFormData {
  profile: ClientProfile;
  addresses?: ClientAddress[];
  emergencyContacts?: EmergencyContact[];
  settings?: ClientSettings;
}

export interface ClientFilters {
  search?: string;
  clientType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | undefined; // Changed to lowercase
  page?: number;
  limit?: number;
}

export interface ClientlistResponse {
  clients: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}