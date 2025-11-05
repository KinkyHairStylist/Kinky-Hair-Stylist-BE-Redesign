// services/emergency-contact.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyContact, ApiResponse } from '../types/client.types';
import { ClientSchema } from '../entities/client.entity';
import { EmergencyContactSchema } from '../entities/emergency-contact.entity';

@Injectable()
export class EmergencyContactService {
  constructor(
    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,

    @InjectRepository(EmergencyContactSchema)
    private readonly emergencyContactRepo: Repository<EmergencyContactSchema>,
  ) {}

  async addEmergencyContact(
    contactData: Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string,
  ): Promise<ApiResponse<EmergencyContact>> {
    try {
      if (!contactData.clientId) {
        return {
          success: false,
          error: 'Client ID missing',
          message: 'clientId is required',
        };
      }

      // Verify client belongs to owner
      const client = await this.clientRepo.findOne({
        where: {
          id: contactData.clientId,
          ownerId: ownerId,
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

      const contact = await this.emergencyContactRepo.save(contactData);
      // const savedContact = await contact.save();

      return {
        success: true,
        data: contact,
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

  async getEmergencyContacts(
    clientId: string,
    ownerId: string,
  ): Promise<ApiResponse<EmergencyContact[]>> {
    try {
      // Verify client belongs to owner
      const client = await this.clientRepo.findOne({
        where: {
          id: clientId,
          ownerId: ownerId,
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

      const contacts = await this.emergencyContactRepo.findBy({
        clientId,
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
