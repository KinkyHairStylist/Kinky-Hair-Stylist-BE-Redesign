import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse } from '../types/client.types';
import { ClientEntity } from '../entities/client.entity';

@Injectable()
export class ClientProfileService {
  constructor(
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
  ) {}

  async createClientProfile(profileData: Partial<ClientEntity>, businessId: string): Promise<ApiResponse<ClientEntity>> {
    try {
      const client = this.clientRepository.create({
        ...profileData,
        businessId,
      });
      const savedClient = await this.clientRepository.save(client);

      return {
        success: true,
        data: savedClient,
        message: 'Client profile created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to create client profile',
      };
    }
  }

  async getClientProfile(clientId: string, businessId: string): Promise<ApiResponse<ClientEntity>> {
    try {
      const client = await this.clientRepository.findOne({
        where: {
          id: clientId,
          businessId,
          isActive: true,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Profile not found',
          message: 'Client profile not found',
        };
      }

      return {
        success: true,
        data: client,
        message: 'Client profile retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch client profile',
      };
    }
  }

  async updateClientProfile(
    clientId: string,
    businessId: string,
    updates: Partial<ClientEntity>,
  ): Promise<ApiResponse<ClientEntity>> {
    try {
      const client = await this.clientRepository.findOne({
        where: {
          id: clientId,
          businessId,
          isActive: true,
        },
      });

      if (!client) {
        return {
          success: false,
          error: 'Profile not found',
          message: 'Client profile not found',
        };
      }

      Object.assign(client, updates);
      const updatedClient = await this.clientRepository.save(client);

      return {
        success: true,
        data: updatedClient,
        message: 'Client profile updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update client profile',
      };
    }
  }

  async validateClientProfile(profileData: Partial<ClientEntity>): Promise<ApiResponse<boolean>> {
    try {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const missingFields = requiredFields.filter(field => !profileData[field]);

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          data: false,
          message: 'Profile validation failed',
        };
      }

      if (profileData.email) {
        const existingClient = await this.clientRepository.findOne({
          where: {
            email: profileData.email,
            isActive: true,
          },
        });
        if (existingClient) {
          return {
            success: false,
            error: 'Email already exists',
            data: false,
            message: 'A client with this email already exists',
          };
        }
      }

      return {
        success: true,
        data: true,
        message: 'Profile validation successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: false,
        message: 'Profile validation failed',
      };
    }
  }
}