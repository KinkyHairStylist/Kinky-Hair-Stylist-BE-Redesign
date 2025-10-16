import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  ClientFormData,
  ClientFilters,
  ClientlistResponse,
  ApiResponse,
  ClientSettings
} from '../types/client.types';

// Import entities
import { ClientEntity } from '../entities/client.entity';
import { ClientAddressEntity } from '../entities/client-address.entity';
import { EmergencyContactEntity } from '../entities/emergency-contact.entity';
import { ClientSettingsEntity } from '../entities/client-settings.entity';
import { BusinessEntity } from '../entities/business.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
    @InjectRepository(ClientAddressEntity)
    private addressRepository: Repository<ClientAddressEntity>,
    @InjectRepository(EmergencyContactEntity)
    private emergencyContactRepository: Repository<EmergencyContactEntity>,
    @InjectRepository(ClientSettingsEntity)
    private settingsRepository: Repository<ClientSettingsEntity>,
    @InjectRepository(BusinessEntity)
    private businessRepository: Repository<BusinessEntity>,
  ) {}

 async createClient(clientData: ClientFormData, ownerId: string): Promise<ApiResponse<any>> {
  try {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
    });
    
    if (!business) {
      return {
        success: false,
        error: 'Business not found',
        message: 'No business found for this user',
      };
    }

    const existingClient = await this.clientRepository.findOne({
      where: {
        email: clientData.profile.email,
        businessId: business.id,
        isActive: true,
      },
    });

    if (existingClient) {
      return {
        success: false,
        error: 'Client already exists',
        message: 'A client with this email already exists in your business',
      };
    }

    const client = this.clientRepository.create({
      ...clientData.profile,
      ownerId,
      businessId: business.id,
    });

    const savedClient = await this.clientRepository.save(client);

    if (clientData.addresses && clientData.addresses.length > 0) {
      const addresses = clientData.addresses.map(address => 
        this.addressRepository.create({
          ...address,
          clientId: savedClient.id,
        })
      );
      await this.addressRepository.save(addresses);
    }

    if (clientData.emergencyContacts && clientData.emergencyContacts.length > 0) {
      const contacts = clientData.emergencyContacts.map(contact => 
        this.emergencyContactRepository.create({
          ...contact,
          clientId: savedClient.id,
        })
      );
      await this.emergencyContactRepository.save(contacts);
    }

    const settingsData: ClientSettings = clientData.settings || {};
    const preferencesData = settingsData.preferences || {};

    // Fix: Create settings with proper type casting
    const settings = this.settingsRepository.create({
      emailNotifications: settingsData.emailNotifications ?? true,
      smsNotifications: settingsData.smsNotifications ?? true,
      marketingEmails: settingsData.marketingEmails ?? false,
      clientType: settingsData.clientType || 'regular',
      notes: settingsData.notes || null,
      clientId: savedClient.id,
      preferences: {
        preferredContactMethod: preferencesData.preferredContactMethod || 'email',
        language: preferencesData.language || 'en',
        timezone: preferencesData.timezone || 'Australia/Sydney',
      },
    } as ClientSettingsEntity);

    await this.settingsRepository.save(settings);

    const populatedClient = await this.getClientWithRelations(savedClient.id);

    return {
      success: true,
      data: populatedClient,
      message: 'Client created successfully',
    };
  } catch (error) {
    console.error('Create client error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create client',
    };
  }
}
  // In the getClients method, update the sortOrder handling:
async getClients(ownerId: string, filters: ClientFilters): Promise<ApiResponse<ClientlistResponse>> {
  try {
    const business = await this.businessRepository.findOne({
      where: { ownerId },
    });
    
    if (!business) {
      return {
        success: false,
        error: 'Business not found',
        message: 'No business found for this user',
        data: { clients: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }

    const {
      search,
      clientType,
      sortBy = 'createdAt',
      sortOrder = 'desc', // Changed to lowercase
      page = 1,
      limit = 10,
    } = filters;

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.businessId = :businessId', { businessId: business.id })
      .andWhere('client.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search OR client.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (clientType && clientType !== 'all') {
      const subQuery = this.settingsRepository
        .createQueryBuilder('settings')
        .select('settings.clientId')
        .where('settings.clientType = :clientType', { clientType });
      
      queryBuilder.andWhere(`client.id IN (${subQuery.getQuery()})`);
    }

    const skip = (page - 1) * limit;

    // Convert lowercase to uppercase for TypeORM
    const typeormSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const [clients, total] = await queryBuilder
      .orderBy(`client.${sortBy}`, typeormSortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const clientsWithSettings = await Promise.all(
      clients.map(async (client) => {
        const settings = await this.settingsRepository.findOne({
          where: { clientId: client.id },
        });
        return {
          ...client,
          settings,
        };
      }),
    );

    return {
      success: true,
      data: {
        clients: clientsWithSettings,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message: 'Clients retrieved successfully',
    };
  } catch (error) {
    console.error('Get clients error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to fetch clients',
    };
  }
}

  async getClientDetails(clientId: string, ownerId: string): Promise<ApiResponse<any>> {
    try {
      const business = await this.businessRepository.findOne({
        where: { ownerId },
      });
      
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientRepository.findOne({
        where: {
          id: clientId,
          businessId: business.id,
          isActive: true,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      const populatedClient = await this.getClientWithRelations(client.id);

      return {
        success: true,
        data: populatedClient,
        message: 'Client details retrieved successfully',
      };
    } catch (error) {
      console.error('Get client details error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch client details',
      };
    }
  }

  async updateClient(
    clientId: string,
    ownerId: string,
    updates: Partial<ClientEntity>,
  ): Promise<ApiResponse<ClientEntity>> {
    try {
      const business = await this.businessRepository.findOne({
        where: { ownerId },
      });
      
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientRepository.findOne({
        where: {
          id: clientId,
          businessId: business.id,
          isActive: true,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      Object.assign(client, updates);
      const updatedClient = await this.clientRepository.save(client);

      return {
        success: true,
        data: updatedClient,
        message: 'Client updated successfully',
      };
    } catch (error) {
      console.error('Update client error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update client',
      };
    }
  }

  async deleteClient(clientId: string, ownerId: string): Promise<ApiResponse<boolean>> {
    try {
      const business = await this.businessRepository.findOne({
        where: { ownerId },
      });
      
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientRepository.findOne({
        where: {
          id: clientId,
          businessId: business.id,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      client.isActive = false;
      await this.clientRepository.save(client);

      return {
        success: true,
        data: true,
        message: 'Client deleted successfully',
      };
    } catch (error) {
      console.error('Delete client error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete client',
      };
    }
  }

  private async getClientWithRelations(clientId: string): Promise<any> {
    const [client, addresses, emergencyContacts, settings] = await Promise.all([
      this.clientRepository.findOne({ where: { id: clientId } }),
      this.addressRepository.find({ where: { clientId } }),
      this.emergencyContactRepository.find({ where: { clientId } }),
      this.settingsRepository.findOne({ where: { clientId } }),
    ]);

    return {
      ...client,
      addresses,
      emergencyContacts,
      settings,
    };
  }
}