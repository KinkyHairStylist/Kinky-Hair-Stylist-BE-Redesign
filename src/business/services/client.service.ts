import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Client, 
  ClientAddress, 
  EmergencyContact, 
  ClientSettings,
  ClientFormData,
  ClientFilters,
  ClientlistResponse,
  ApiResponse 
} from '../types/client.types';
import { ClientModel } from '../schemas/client.schema';
import { ClientAddressModel } from '../schemas/client-address.schema';
import { EmergencyContact as EmergencyContactModel } from '../schemas/emergency-contact.schema';
import { ClientSettingsModel } from '../schemas/client-settings.schema';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(ClientModel.name) private clientModel: Model<Client>,
    @InjectModel(ClientAddressModel.name) private addressModel: Model<ClientAddress>,
    @InjectModel(EmergencyContactModel.name) private emergencyContactModel: Model<EmergencyContact>,
    @InjectModel(ClientSettingsModel.name) private settingsModel: Model<ClientSettings>,
    @InjectModel('Business') private businessModel: Model<any>,
  ) {}

  async createClient(clientData: ClientFormData, ownerId: string): Promise<ApiResponse<any>> {
    try {
       
      const business = await this.businessModel.findOne({ ownerId: new Types.ObjectId(ownerId) });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

       
      const existingClient = await this.clientModel.findOne({
        email: clientData.profile.email,
        businessId: business._id,
        isActive: true
      });

      if (existingClient) {
        return {
          success: false,
          error: 'Client already exists',
          message: 'A client with this email already exists in your business',
        };
      }

       
      const client = new this.clientModel({
        ...clientData.profile,
        ownerId: new Types.ObjectId(ownerId),
        businessId: business._id,
      });

      const savedClient = await client.save();

       
      if (clientData.addresses && clientData.addresses.length > 0) {
        const addresses = clientData.addresses.map(address => ({
          ...address,
          clientId: savedClient._id,
        }));
        await this.addressModel.insertMany(addresses);
      }

       
      if (clientData.emergencyContacts && clientData.emergencyContacts.length > 0) {
        const contacts = clientData.emergencyContacts.map(contact => ({
          ...contact,
          clientId: savedClient._id,
        }));
        await this.emergencyContactModel.insertMany(contacts);
      }

      // Create settings
      const settingsData = clientData.settings || {};
      const settings = new this.settingsModel({
        ...settingsData,
        clientId: savedClient._id,
        preferences: {
          ...(settingsData.preferences || {}),
          language: 'en',
          timezone: 'Australia/Sydney',
          preferredContactMethod: settingsData.preferences?.preferredContactMethod || 'email'
        }
      });
      await settings.save();

      // Return populated client
      const populatedClient = await this.getClientWithRelations(savedClient._id);

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

  async getClients(ownerId: string, filters: ClientFilters): Promise<ApiResponse<ClientlistResponse>> {
    try {
      const business = await this.businessModel.findOne({ ownerId: new Types.ObjectId(ownerId) });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
          data: { clients: [], total: 0, page: 1, limit: 10, totalPages: 0 }
        };
      }

      const {
        search,
        clientType,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = filters;

      const query: any = { 
        businessId: business._id, 
        isActive: true 
      };

      // Search filter
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      // Client type filter
      if (clientType && clientType !== 'all') {
        const clientIdsWithType = await this.settingsModel
          .find({ clientType })
          .distinct('clientId');
        query._id = { $in: clientIdsWithType };
      }

      const skip = (page - 1) * limit;
      const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [clients, total] = await Promise.all([
        this.clientModel
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        this.clientModel.countDocuments(query),
      ]);

      // Get settings for each client
      const clientsWithSettings = await Promise.all(
        clients.map(async (client) => {
          const settings = await this.settingsModel.findOne({ clientId: client._id }).lean();
          return {
            ...client,
            settings
          };
        })
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
      const business = await this.businessModel.findOne({ ownerId: new Types.ObjectId(ownerId) });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientModel.findOne({
        _id: new Types.ObjectId(clientId),
        businessId: business._id,
        isActive: true
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      const populatedClient = await this.getClientWithRelations(client._id);

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
    updates: Partial<Client>,
  ): Promise<ApiResponse<Client>> {
    try {
      const business = await this.businessModel.findOne({ ownerId: new Types.ObjectId(ownerId) });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientModel.findOneAndUpdate(
        { 
          _id: new Types.ObjectId(clientId), 
          businessId: business._id, 
          isActive: true 
        },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      return {
        success: true,
        data: client,
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
      const business = await this.businessModel.findOne({ ownerId: new Types.ObjectId(ownerId) });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const client = await this.clientModel.findOneAndUpdate(
        { 
          _id: new Types.ObjectId(clientId), 
          businessId: business._id 
        },
        { isActive: false, updatedAt: new Date() },
        { new: true },
      );

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

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

  private async getClientWithRelations(clientId: Types.ObjectId): Promise<any> {
    const [client, addresses, emergencyContacts, settings] = await Promise.all([
      this.clientModel.findById(clientId).lean(),
      this.addressModel.find({ clientId }).lean(),
      this.emergencyContactModel.find({ clientId }).lean(),
      this.settingsModel.findOne({ clientId }).lean(),
    ]);

    return {
      ...client,
      addresses,
      emergencyContacts,
      settings
    };
  }
}