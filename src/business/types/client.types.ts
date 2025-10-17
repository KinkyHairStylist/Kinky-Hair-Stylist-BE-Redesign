export interface Client{
    id : string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date | string;
    gender?: string;
    pronouns?: string;
    address?: string;
    clientSource?: string;
    profileImage?: string;
    businessId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;


}



export interface ClientAddress{


    id : string;
    clientId: string;
    addressName: string;
    addressLine1: string;
    addressLine2?: string | null;
    location: string;
    city: string | null;
    state: string;
    zipCode: string;
    country: string;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
}


export interface EmergencyContact{
    id: string;
    clientId: string;
    firstName: string;
    lastName?: string;
    email: string;
    relationship: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
}




export interface ClientSettings{

    id: string;
    clientId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    clientType: 'regular' | 'vip' | 'new';
    notes?: string;

    preferences: {
    preferredContactMethod: 'email' | 'sms' | 'phone';
    timeZone: string;
    language: string;
    };
    createdAt: Date;
    updatedAt: Date;

}

export interface ClientFormData{

    profile: Omit<Client, 'id' | 'businessId' | 'isActive' | 'createdAt' | 'updatedAt'>;
    addresses?: Omit<ClientAddress, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>[];
    emergencyContacts?: Omit<EmergencyContact, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>[];
    settings: Omit<ClientSettings, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>;
}




export interface ClientFilters{

    search?: string;
    clientType?: 'regular' | 'vip' | 'new'|'all';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}





export interface ApiResponse<T>{
    data?: T;
    message?: string;
    success: boolean;
    error?: string;
    
}




export interface ClientlistResponse{
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}