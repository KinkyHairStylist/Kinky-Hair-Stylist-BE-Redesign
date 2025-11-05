import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Client, ApiResponse } from '../types/client.types';
import { ClientSchema } from '../entities/client.entity';
import { CreateClientDto } from '../dtos/requests/client.dto';

@Injectable()
export class ClientProfileService {
  constructor(
    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,
  ) {}

  async createClientProfile(
    profileData: Partial<CreateClientDto>,
    ownerId: string,
  ): Promise<ApiResponse<Client>> {
    try {
      const client = await this.clientRepo.save({
        ...profileData,
        ownerId,
      });

      return {
        success: true,
        data: client,
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

  async getClientProfile(
    clientId: string,
    ownerId: string,
  ): Promise<ApiResponse<Client>> {
    try {
      const client = await this.clientRepo.findOne({
        where: {
          id: clientId,
          ownerId,
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
    ownerId: string,
    updates: Partial<Client>,
  ): Promise<ApiResponse<Client>> {
    try {
      const result = await this.clientRepo.update(
        { id: clientId, ownerId, isActive: true },
        { ...updates, updatedAt: new Date() },
      );

      // Check if any rows were affected
      if (result.affected === 0) {
        return {
          success: false,
          error: 'Profile not found',
          message: 'Client profile not found',
        };
      }

      // Fetch the updated client to return it
      const client = await this.clientRepo.findOne({
        where: {
          id: clientId,
          ownerId,
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

  async validateClientProfile(
    profileData: Partial<Client>,
  ): Promise<ApiResponse<boolean>> {
    try {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
      const missingFields = requiredFields.filter(
        (field) => !profileData[field],
      );

      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          data: false,
          message: 'Profile validation failed',
        };
      }

      // Check if email already exists
      if (profileData.email) {
        const existingClient = await this.clientRepo.findOne({
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
