import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Client,
  ClientFormData,
  ClientFilters,
  ClientlistResponse,
  ApiResponse,
} from '../types/client.types';
import { Business } from '../entities/business.entity';
import { ClientSchema } from '../entities/client.entity';
import { ClientAddressSchema } from '../entities/client-address.entity';
import { EmergencyContactSchema } from '../entities/emergency-contact.entity';
import {
  ClientSettingsSchema,
  ClientType,
} from '../entities/client-settings.entity';
import { formatClientType } from '../utils/client.utils';
import { ClientFiltersDto, UpdateClientDto } from '../dtos/requests/ClientDto';
import {
  BusinessCloudinaryService,
  FileUpload,
} from './business-cloudinary.service';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(ClientSchema)
    private readonly clientRepo: Repository<ClientSchema>,

    @InjectRepository(ClientAddressSchema)
    private readonly clientAddressRepo: Repository<ClientAddressSchema>,

    @InjectRepository(EmergencyContactSchema)
    private readonly emergencyContactRepo: Repository<EmergencyContactSchema>,

    @InjectRepository(ClientSettingsSchema)
    private readonly clientSettingsRepo: Repository<ClientSettingsSchema>,

    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,

    private readonly businessCloudinaryService: BusinessCloudinaryService,
  ) {}

  async createClient(
    clientData: ClientFormData,
    ownerId: string,
    bodyProfileImage: FileUpload,
  ): Promise<ApiResponse<any>> {
    try {
      // const business = await this.businessRepo.findOne({
      //   where: { ownerId },
      // });
      // if (!business) {
      //   return {
      //     success: false,
      //     error: 'Business not found',
      //     message: 'No business found for this user',
      //   };
      // }

      const existingClient = await this.clientRepo.findOne({
        where: {
          email: clientData.profile.email,
          ownerId,
          isActive: true,
        },
      });

      if (existingClient) {
        return {
          success: false,
          error: 'Client already exists',
          message: 'A client with this email already exists in your business',
        };
      }

      let profileImage;

      const clientName =
        `${clientData.profile.firstName}-${clientData.profile.lastName}`
          .trim()
          .replace(/\s+/g, '_'); // replace spaces with underscores

      const folderPath = `KHS/business/${ownerId}/clients/${clientName}`;

      if (bodyProfileImage) {
        try {
          const { profileImageUrl } =
            await this.businessCloudinaryService.uploadClientProfileImage(
              bodyProfileImage,
              folderPath,
            );

          profileImage = profileImageUrl;
        } catch (error) {
          return {
            success: false,
            error: error.message,
            message: error.message || 'Failed to create client profile image',
          };
        }
      }

      const savedClient = await this.clientRepo.save({
        ...clientData.profile,
        profileImage,
        ownerId: ownerId,
      });

      const placeholderAddress = [{ addressName: 'None' }];

      // Addresses
      await this.clientAddressRepo.insert(
        placeholderAddress.map(() => ({
          clientId: savedClient.id,
          isPrimary: false,
        })),
      );

      // if (clientData.addresses && clientData.addresses.length > 0) {
      //   const addresses = clientData.addresses.map((address) => ({
      //     ...address,
      //     clientId: savedClient.id,
      //   }));
      //   // Ensure only one primary
      //   const hasPrimary = addresses.some((a) => a.isPrimary);
      //   if (hasPrimary) {
      //     await this.clientAddressRepo.update(
      //       { clientId: savedClient.id, isPrimary: true },
      //       { isPrimary: false },
      //     );
      //   }

      //   // Insert all
      //   await this.clientAddressRepo.insert(addresses);
      // }

      // Emergency coNTACTS

      const placeholderEmergencyContacts = [{ firstName: 'None' }];

      // contacts
      await this.emergencyContactRepo.insert(
        placeholderEmergencyContacts.map(() => ({
          clientId: savedClient.id,
        })),
      );

      // if (
      //   clientData.emergencyContacts &&
      //   clientData.emergencyContacts.length > 0
      // ) {
      //   const contacts = clientData.emergencyContacts.map((contact) => ({
      //     ...contact,
      //     clientId: savedClient.id,
      //   }));
      //   await this.emergencyContactRepo.insert(contacts);
      // }

      // Settings
      if (clientData.settings) {
        const settingsData = {
          ...clientData.settings,
          clientId: savedClient.id,
        };
        await this.clientSettingsRepo.save(settingsData);
      }

      // Return populated client
      const populatedClient = await this.getClientWithRelations(savedClient.id);

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

  async getClients(
    ownerId: string,
    filters: ClientFiltersDto,
  ): Promise<ApiResponse<ClientlistResponse>> {
    try {
      // const business = await this.businessRepo.findOne({
      //   where: { ownerId },
      // });
      // if (!business) {
      //   return {
      //     success: false,
      //     error: 'Business not found',
      //     message: 'No business found for this user',
      //     data: { clients: [], total: 0, page: 1, limit: 10, totalPages: 0 },
      //   };
      // }

      const {
        search,
        clientType,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 9,
      } = filters;

      // Build query with QueryBuilder
      const queryBuilder = this.clientRepo
        .createQueryBuilder('client')
        .where('client.ownerId = :ownerId', { ownerId })
        .andWhere('client.isActive = :isActive', { isActive: true });

      // Search filter (case-insensitive LIKE)
      if (search) {
        queryBuilder.andWhere(
          '(LOWER(client.firstName) LIKE LOWER(:search) OR ' +
            'LOWER(client.lastName) LIKE LOWER(:search) OR ' +
            'LOWER(client.email) LIKE LOWER(:search) OR ' +
            'client.phone LIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Client type filter (join with settings table)
      if (clientType && clientType !== 'all') {
        queryBuilder.andWhere('client.clientType = :clientType', {
          clientType,
        });
      }

      // Sorting
      const sortColumn =
        sortBy === 'createdAt' ? 'client.createdAt' : `client.${sortBy}`;
      queryBuilder.orderBy(
        sortColumn,
        sortOrder.toUpperCase() as 'ASC' | 'DESC',
      );

      // Pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute query and get total count
      const [clients, total] = await queryBuilder.getManyAndCount();

      // Early return if no clients found
      if (clients.length === 0) {
        return {
          success: true,
          data: {
            clients: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit,
            startIndex: 0,
            endIndex: 0,
          },
          message: 'No clients found',
        };
      }

      // Get client IDs for batch fetching addresses
      const clientIds = clients.map((client) => client.id);

      const addresses = await this.clientAddressRepo
        .createQueryBuilder('address')
        .where('address.clientId IN (:...clientIds)', { clientIds })
        .getMany();

      // Create a map of clientId -> address for quick lookup
      const addressMap = new Map(
        addresses.map((addr) => [addr.clientId, addr.addressLine1]),
      );

      // Transform data (settings already loaded via leftJoinAndSelect)
      const clientsWithSettings = clients.map((client) => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        dateOfBirth: client.dateOfBirth,
        gender: client.gender,
        pronouns: client.pronouns,
        address: addressMap.get(client.id) || undefined,
        clientType: formatClientType(client.clientType || ClientType.REGULAR),
        clientSource: client.clientSource,
        profileImage: client.profileImage,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        ownerId,
      }));

      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit + 1;
      const endIndex = Math.min(page * limit, total);

      return {
        success: true,
        data: {
          clients: clientsWithSettings,
          totalItems: total,
          totalPages,
          currentPage: page,
          pageSize: limit,
          startIndex,
          endIndex,
        },
        message: 'Clients retrieved successfully',
      };
    } catch (error) {
      // console.log('Get clients error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch clients',
      };
    }
  }

  async getClientDetails(
    clientId: string,
    ownerId: string,
  ): Promise<ApiResponse<any>> {
    try {
      // const business = await this.businessRepo.findOne({
      //   where: { ownerId },
      // });
      // if (!business) {
      //   return {
      //     success: false,
      //     error: 'Business not found',
      //     message: 'No business found for this user',
      //   };
      // }

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
          error: 'Client not found',
          message: 'Client not found or access denied',
        };
      }

      const populatedClient = await this.getClientWithRelations(client.id);

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
    updates: UpdateClientDto,
    bodyProfileImage: FileUpload,
  ): Promise<ApiResponse<UpdateClientDto>> {
    try {
      // const business = await this.businessRepo.findOne({
      //   where: { owner: { id: ownerId } },
      // });
      // if (!business) {
      //   return {
      //     success: false,
      //     error: 'Business not found',
      //     message: 'No business found for this user',
      //   };
      // }

      const profilePictureExist =
        updates.profilePicture?.includes('cloudinary');

      let profileImage;

      if (!profilePictureExist) {
        const clientName = `${updates.firstName}-${updates.lastName}`
          .trim()
          .replace(/\s+/g, '_'); // replace spaces with underscores

        const folderPath = `KHS/business/${ownerId}/clients/${clientName}`;

        if (bodyProfileImage) {
          try {
            const { profileImageUrl } =
              await this.businessCloudinaryService.uploadClientProfileImage(
                bodyProfileImage,
                folderPath,
              );

            profileImage = profileImageUrl;
          } catch (error) {
            return {
              success: false,
              error: error.message,
              message: error.message || 'Failed to create client profile image',
            };
          }
        }
      }

      // Check if all fields are undefined
      const hasUpdates = Object.values(updates).some(
        (value) => value !== undefined,
      );

      if (!hasUpdates) {
        // No updates provided
        return {
          success: true,
          data: updates,
          message: 'No changes made to profile.',
        };
      }

      const { profilePicture, ...restUpdates } = updates;

      // Perform the update
      const result = await this.clientRepo.update(
        {
          id: clientId,
          ownerId,
          isActive: true,
        },
        {
          ...restUpdates,
          profileImage: profilePictureExist
            ? updates.profilePicture
            : profileImage,
          updatedAt: new Date(),
        },
      );

      // Check if any rows were affected
      if (result.affected === 0) {
        return {
          success: false,
          error: 'Client not found',
          message: 'Client not found or access denied',
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

  async deleteClient(
    clientId: string,
    ownerId: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const business = await this.businessRepo.findOne({
        where: { ownerId },
      });
      if (!business) {
        return {
          success: false,
          error: 'Business not found',
          message: 'No business found for this user',
        };
      }

      const result = await this.clientRepo.update(
        {
          id: clientId,
          ownerId,
        },
        {
          isActive: false,
          updatedAt: new Date(),
        },
      );

      if (result.affected === 0) {
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

  private async getClientWithRelations(clientId: string): Promise<any> {
    const [client, addresses, emergencyContacts, settings] = await Promise.all([
      this.clientRepo.findOneBy({ id: clientId }),
      this.clientAddressRepo.findBy({ clientId }),
      this.emergencyContactRepo.findBy({ clientId }),
      this.clientSettingsRepo.findOneBy({ clientId }),
    ]);

    return {
      profile: client,
      addresses,
      emergencyContacts,
      settings,
    };
  }
}
