import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientService } from '../services/client.service';
import { ClientProfileService } from '../services/client-profile.service';
import { ClientAddressService } from '../services/client-address.service';
import { EmergencyContactService } from '../services/emergency-contact.service';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientFiltersDto,
  CreateClientAddressDto,
  CreateEmergencyContactDto,
  CreateClientSettingsDto,
  CreateClientProfileDto,
} from '../dtos/requests/client.dto';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';
import { ClientFormData } from '../types/client.types';
import { ClientType } from '../entities/client-settings.entity';
import { ClientSettingsService } from '../services/client-settings.service';

@Controller('clients')
// @UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly clientProfileService: ClientProfileService,
    private readonly clientAddressService: ClientAddressService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly clientSettingsService: ClientSettingsService,
  ) {}

  @Post()
  async createClient(@Request() req, @Body() createClientDto: CreateClientDto) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Transform the data to match ClientFormData exactly
    const clientFormData: ClientFormData = {
      profile: {
        firstName: createClientDto.profile.firstName,
        lastName: createClientDto.profile.lastName,
        email: createClientDto.profile.email,
        phone: createClientDto.profile.phone,
        dateOfBirth: createClientDto.profile.dateOfBirth
          ? typeof createClientDto.profile.dateOfBirth === 'string'
            ? new Date(createClientDto.profile.dateOfBirth)
            : createClientDto.profile.dateOfBirth
          : new Date(),
        gender: createClientDto.profile.gender || undefined,
        pronouns: createClientDto.profile.pronouns || undefined,
        clientSource: createClientDto.profile.clientSource,
        profileImage: createClientDto.profile.profileImage || undefined,
        address: undefined,
      },
      addresses: createClientDto.addresses
        ? createClientDto.addresses.map((addr) => ({
            addressName: addr.addressName,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || null,
            location: addr.location,
            city: addr.city || null,
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            country: addr.country || '',
            isPrimary: addr.isPrimary || false,
          }))
        : undefined,
      emergencyContacts: createClientDto.emergencyContacts
        ? createClientDto.emergencyContacts.map((contact) => ({
            firstName: contact.firstName,
            lastName: contact.lastName || undefined,
            email: contact.email,
            relationship: contact.relationship,
            phone: contact.phone,
          }))
        : undefined,
      settings: {
        emailNotifications:
          createClientDto.settings?.emailNotifications || false,
        smsNotifications: createClientDto.settings?.smsNotifications || false,
        marketingEmails: createClientDto.settings?.marketingEmails || false,
        clientType: createClientDto.settings?.clientType,
        notes: createClientDto.settings?.notes || undefined,
        preferences: {
          preferredContactMethod:
            createClientDto.settings?.preferences.preferredContactMethod ??
            'email',
          language: createClientDto.settings?.preferences?.language || 'en',
          timezone: createClientDto.settings?.preferences?.timezone || 'UTC',
        },
      },
    };

    const result = await this.clientService.createClient(
      clientFormData,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Get()
  async getClients(@Request() req, @Query() filters: ClientFiltersDto) {
    const ownerId = req.user.sub || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Validate clientType to match allowed values
    const allowedTypes: ClientType[] = [];
    const clientType: (typeof allowedTypes)[number] | undefined =
      filters.clientType && allowedTypes.includes(filters.clientType as any)
        ? (filters.clientType as (typeof allowedTypes)[number])
        : undefined;

    // Ensure sortOrder is "asc", "desc", or undefined
    const allowedSortOrders = ['asc', 'desc'] as const;
    const sortOrder: (typeof allowedSortOrders)[number] | undefined =
      filters.sortOrder && allowedSortOrders.includes(filters.sortOrder as any)
        ? (filters.sortOrder as (typeof allowedSortOrders)[number])
        : undefined;

    const result = await this.clientService.getClients(ownerId, {
      ...filters,
      clientType,
      sortOrder,
    });

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Get('/client/search')
  async searchClients(
    @Request() req,
    @Query('q') query: string,
    @Query() filters: ClientFiltersDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Validate clientType to match allowed values
    const allowedTypes: ClientType[] = [];
    const clientType: (typeof allowedTypes)[number] | undefined =
      allowedTypes.includes(filters.clientType as any)
        ? (filters.clientType as (typeof allowedTypes)[number])
        : undefined;

    // Ensure sortOrder is "asc", "desc", or undefined
    const allowedSortOrders = ['asc', 'desc'] as const;
    const sortOrder: (typeof allowedSortOrders)[number] | undefined =
      filters.sortOrder && allowedSortOrders.includes(filters.sortOrder as any)
        ? (filters.sortOrder as (typeof allowedSortOrders)[number])
        : undefined;

    const result = await this.clientService.getClients(ownerId, {
      ...filters,
      clientType,
      search: query,
      sortOrder,
    });

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Get('/client/:clientId')
  async getClientDetails(@Request() req, @Param('clientId') clientId: string) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientService.getClientDetails(clientId, ownerId);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Patch('/client/:clientId')
  async updateClient(
    @Request() req,
    @Param('clientId') clientId: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientService.updateClient(
      clientId,
      ownerId,
      updateClientDto,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Delete('/client/:clientId')
  async deleteClient(@Request() req, @Param('clientId') clientId: string) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientService.deleteClient(clientId, ownerId);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Post('/client/profile')
  async createClientProfile(
    @Request() req,
    @Body() profileData: CreateClientProfileDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientProfileService.createClientProfile(
      profileData,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Get('/client/:clientId/profile')
  async getClientProfile(@Request() req, @Param('clientId') clientId: string) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientProfileService.getClientProfile(
      clientId,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('/client/validate/profile')
  async validateClientProfile(@Body() profileData: any) {
    const result =
      await this.clientProfileService.validateClientProfile(profileData);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Post('/client/addresses')
  async addClientAddress(
    @Request() req,
    @Body() body: { addresses: CreateClientAddressDto[] },
  ) {
    console.log('BODY', body.addresses);
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Validate that addresses array exists and is not empty
    if (
      !body.addresses ||
      !Array.isArray(body.addresses) ||
      body.addresses.length === 0
    ) {
      throw new HttpException(
        'Addresses array is required and must not be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Optional: Limit to 2 addresses
    if (body.addresses.length > 2) {
      throw new HttpException(
        'Maximum 2 addresses allowed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Transform all addresses
    const transformedAddresses = body.addresses.map((addressData) => ({
      clientId: addressData.clientId,
      addressName: addressData.addressName,
      addressLine1: addressData.addressLine1,
      addressLine2: addressData.addressLine2 ? addressData.addressLine2 : null,
      location: addressData.location,
      city: addressData.city || null,
      state: addressData.state || '',
      zipCode: addressData.zipCode || '',
      country: addressData.country || '',
      isPrimary: addressData.isPrimary || false,
    }));

    // Process all addresses with individual error handling
    const results = await Promise.all(
      transformedAddresses.map((address) =>
        this.clientAddressService.addClientAddress(address as any, ownerId),
      ),
    );

    // Check if any failed
    const failedResults = results.filter((result) => !result.success);

    if (failedResults.length > 0) {
      throw new HttpException(
        {
          message: 'Some addresses failed to save',
          errors: failedResults.map((r) => ({
            message: r.message,
            error: r.error,
          })),
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Collect all successfully saved addresses
    const savedAddresses = results
      .filter((r) => r.success && r.data)
      .map((r) => r.data);

    return {
      success: true,
      message: `${savedAddresses.length} address(es) added successfully`,
      data: savedAddresses,
    };
  }

  @Get('/client/:clientId/addresses')
  async getClientAddresses(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientAddressService.getClientAddresses(
      clientId,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('/client/emergency-contacts')
  async addEmergencyContact(
    @Request() req,
    @Body() contactData: CreateEmergencyContactDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.emergencyContactService.addEmergencyContact(
      contactData,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  @Get('/client/:clientId/emergency-contacts')
  async getEmergencyContacts(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user._id || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.emergencyContactService.getEmergencyContacts(
      clientId,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('/client/settings')
  async addClientSettings(
    @Request() req,
    @Body() clientSettingsData: CreateClientSettingsDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;
    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.clientSettingsService.addClientSettings(
      clientSettingsData,
      ownerId,
    );

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }
}
