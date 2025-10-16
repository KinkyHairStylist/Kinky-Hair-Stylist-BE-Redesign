import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse } from '../types/client.types';
import { EmergencyContactEntity } from '../entities/emergency-contact.entity';
import { ClientEntity } from '../entities/client.entity';

@Injectable()
export class EmergencyContactService {
  constructor(
    @InjectRepository(EmergencyContactEntity)
    private emergencyContactRepository: Repository<EmergencyContactEntity>,
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
  ) {}

  async addEmergencyContact(
    contactData: Omit<EmergencyContactEntity, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string,
  ): Promise<ApiResponse<EmergencyContactEntity>> {
    try {
      const client = await this.clientRepository.findOne({
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

      const contact = this.emergencyContactRepository.create(contactData);
      const savedContact = await this.emergencyContactRepository.save(contact);

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

  async getEmergencyContacts(clientId: string, ownerId: string): Promise<ApiResponse<EmergencyContactEntity[]>> {
    try {
      const client = await this.clientRepository.findOne({
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

      const contacts = await this.emergencyContactRepository.find({
        where: { clientId: clientId },
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