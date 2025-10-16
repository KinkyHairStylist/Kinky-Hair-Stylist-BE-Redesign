import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse } from '../types/client.types';
import { ClientAddressEntity } from '../entities/client-address.entity';
import { ClientEntity } from '../entities/client.entity';




@Injectable()
export class ClientAddressService {
  constructor(
    @InjectRepository(ClientAddressEntity)
    private addressRepository: Repository<ClientAddressEntity>,
    @InjectRepository(ClientEntity)
    private clientRepository: Repository<ClientEntity>,
  ) {}

  async addClientAddress(
    addressData: Omit<ClientAddressEntity, 'id' | 'createdAt' | 'updatedAt'>,
    ownerId: string,
  ): Promise<ApiResponse<ClientAddressEntity>> {
    try {
      const client = await this.clientRepository.findOne({
        where: {
          id: addressData.clientId,
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

      if (addressData.isPrimary) {
        await this.addressRepository.update(
          { clientId: addressData.clientId, isPrimary: true },
          { isPrimary: false },
        );
      }

      const address = this.addressRepository.create(addressData);
      const savedAddress = await this.addressRepository.save(address);

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

  async getClientAddresses(clientId: string, ownerId: string): Promise<ApiResponse<ClientAddressEntity[]>> {
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

      const addresses = await this.addressRepository.find({
        where: { clientId: clientId },
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