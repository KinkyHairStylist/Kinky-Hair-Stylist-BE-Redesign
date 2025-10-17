// services/emergency-contact.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmergencyContact, ApiResponse } from '../types/client.types';
import { EmergencyContact as EmergencyContactModel } from '../schemas/emergency-contact.schema';
import { ClientModel } from '../schemas/client.schema';

@Injectable()
export class EmergencyContactService {
  constructor(
    @InjectModel(EmergencyContactModel.name) private emergencyContactModel: Model<EmergencyContact>,
    @InjectModel(ClientModel.name) private clientModel: Model<any>,
  ) {}

  async addEmergencyContact(
    contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string,
  ): Promise<ApiResponse<EmergencyContact>> {
    try {
      // Verify client belongs to owner
      const client = await this.clientModel.findOne({
        _id: new Types.ObjectId(contactData.clientId),
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

      const contact = new this.emergencyContactModel(contactData);
      const savedContact = await contact.save();

      return {
        success: true,
        data: savedContact,
        message: 'Emergency contact added successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add emergency contact',
      };
    }
  }

  async getEmergencyContacts(clientId: string, ownerId: string): Promise<ApiResponse<EmergencyContact[]>> {
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

      const contacts = await this.emergencyContactModel.find({ 
        clientId: new Types.ObjectId(clientId) 
      });

      return {
        success: true,
        data: contacts,
        message: 'Emergency contacts retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch emergency contacts',
      };
    }
  }
}