import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientAddress, ApiResponse } from '../types/client.types';
// Update the import path below to match your actual schema file location and name
import { ClientAddressModel } from '../schemas/client-address.schema';
// OR
// import { ClientAddressModel } from '../schemes/client-address.schema';
// (Choose the correct path and filename based on your project structure)
// Update the import path if the file is named differently or located elsewhere
import { ClientModel } from '../schemas/client.schema';
// OR
// import { ClientModel } from '../schemes/client.schema';
// (Choose the correct path and filename based on your project structure)

@Injectable()
export class ClientAddressService {
  constructor(
    @InjectModel(ClientAddressModel.name) private addressModel: Model<ClientAddress>,
    @InjectModel(ClientModel.name) private clientModel: Model<any>,
  ) {}

  async addClientAddress(
    addressData: Omit<ClientAddress, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string,
  ): Promise<ApiResponse<ClientAddress>> {
    try {
      // Verify client belongs to owner
      const client = await this.clientModel.findOne({
        _id: new Types.ObjectId(addressData.clientId),
        ownerId: new Types.ObjectId(ownerId),
        isActive: true,
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      // If this is set as primary, unset other primary addresses
      if (addressData.isPrimary) {
        await this.addressModel.updateMany(
          { clientId: addressData.clientId, isPrimary: true },
          { isPrimary: false },
        );
      }

      const address = new this.addressModel(addressData);
      const savedAddress = await address.save();

      return {
        success: true,
        data: savedAddress,
        message: 'Address added successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add client address',
      };
    }
  }

  async getClientAddresses(clientId: string, ownerId: string): Promise<ApiResponse<ClientAddress[]>> {
    try {
      // Verify client belongs to owner
      const client = await this.clientModel.findOne({
        _id: new Types.ObjectId(clientId),
        ownerId: new Types.ObjectId(ownerId),
        isActive: true,
      });

      if (!client) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      const addresses = await this.addressModel.find({ 
        clientId: new Types.ObjectId(clientId) 
      });

      return {
        success: true,
        data: addresses,
        message: 'Addresses retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch client addresses',
      };
    }
  }
}