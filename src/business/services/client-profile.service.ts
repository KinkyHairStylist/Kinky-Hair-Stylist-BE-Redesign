
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ApiResponse } from '../types/client.types';
import { ClientModel } from '../schemas/client.schema';

@Injectable()
export class ClientProfileService {
  constructor(
    @InjectModel(ClientModel.name) private clientModel: Model<Client>,
  ) {}

  async createClientProfile(profileData: Partial<Client>, businessId: string): Promise<ApiResponse<Client>> {
    try {
      const client = new this.clientModel({
        ...profileData,
        businessId,
      });
      const savedClient = await client.save();

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

  async getClientProfile(clientId: string, businessId: string): Promise<ApiResponse<Client>> {
    try {
      const client = await this.clientModel.findOne({
        _id: clientId,
        businessId,
        isActive: true,
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
    updates: Partial<Client>,
  ): Promise<ApiResponse<Client>> {
    try {
      const client = await this.clientModel.findOneAndUpdate(
        { _id: clientId, businessId, isActive: true },
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true },
      );

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

  async validateClientProfile(profileData: Partial<Client>): Promise<ApiResponse<boolean>> {
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

      // Check if email already exists
      if (profileData.email) {
        const existingClient = await this.clientModel.findOne({
          email: profileData.email,
          isActive: true,
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
