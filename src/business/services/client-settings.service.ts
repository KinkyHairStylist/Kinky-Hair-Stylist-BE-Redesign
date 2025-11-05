import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse, ClientSettings } from '../types/client.types';
import { ClientSchema } from '../entities/client.entity';
import { ClientSettingsSchema } from '../entities/client-settings.entity';
import { CreateClientSettingsDto } from '../dtos/requests/client.dto';
// Update the import path below to match your actual schema file location and name
// OR
// import { ClientAddressModel } from '../schemes/client-address.schema';
// (Choose the correct path and filename based on your project structure)
// Update the import path if the file is named differently or located elsewhere

// OR
// import { ClientModel } from '../schemes/client.schema';
// (Choose the correct path and filename based on your project structure)

@Injectable()
export class ClientSettingsService {
  constructor(
    @InjectRepository(ClientSettingsSchema)
    private readonly clientSettingsRepo: Repository<ClientSettingsSchema>,

    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,
  ) {}

  async addClientSettings(
    clientSettingsData: Partial<CreateClientSettingsDto>,
    ownerId: string,
  ): Promise<ApiResponse<ClientSettings>> {
    try {
      if (!clientSettingsData.clientId) {
        return {
          success: false,
          error: 'Client ID missing',
          message: 'clientId is required',
        };
      }

      // Verify client belongs to owner
      const client = await this.clientRepo.findOne({
        where: {
          id: clientSettingsData.clientId,
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

      const settings = await this.clientSettingsRepo.save(clientSettingsData);
      // const savedAddress = await address.save();

      return {
        success: true,
        data: settings,
        message: 'Settings added successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add client settings',
      };
    }
  }

  //   async getClientAddresses(
  //     clientId: string,
  //     ownerId: string,
  //   ): Promise<ApiResponse<ClientAddress[]>> {
  //     try {
  //       // Verify client belongs to owner
  //       const client = await this.clientRepo.findOne({
  //         where: {
  //           id: clientId,
  //           ownerId: ownerId,
  //           isActive: true,
  //         },
  //       });
  //       if (!client) {
  //         return {
  //           success: false,
  //           error: 'Client not found',
  //           message: 'Client not found or access denied',
  //         };
  //       }

  //       const addresses = await this.clientAddressRepo.findBy({
  //         clientId,
  //       });

  //       return {
  //         success: true,
  //         data: addresses,
  //         message: 'Addresses retrieved successfully',
  //       };
  //     } catch (error) {
  //       return {
  //         success: false,
  //         error: error.message,
  //         message: 'Failed to fetch client addresses',
  //       };
  //     }
  //   }
}
