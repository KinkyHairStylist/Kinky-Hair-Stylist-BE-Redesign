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
  HttpStatus
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
  CreateEmergencyContactDto
} from '../dtos/requests/client.dto';
import { JwtAuthGuard } from '../middlewares/guards/jwt-auth.guard';
import { ClientFormData } from '../types/client.types';
import { ClientEntity } from '../entities/client.entity';

@Controller('clients')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly clientProfileService: ClientProfileService,
    private readonly clientAddressService: ClientAddressService,
    private readonly emergencyContactService: EmergencyContactService,
  ) {}

  @Post()
  async createClient(
    @Request() req,
    @Body() createClientDto: CreateClientDto,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Transform the data to match ClientFormData exactly
    const clientFormData: ClientFormData = {
      profile: {
        firstName: createClientDto.profile.firstName,
        lastName: createClientDto.profile.lastName,
        email: createClientDto.profile.email,
        phone: createClientDto.profile.phone,
        dateOfBirth: createClientDto.profile.dateOfBirth || undefined,
        gender: createClientDto.profile.gender || undefined,
        pronouns: createClientDto.profile.pronouns || undefined,
        occupation: createClientDto.profile.occupation || undefined,
        clientSource: createClientDto.profile.clientSource,
        profileImage: createClientDto.profile.profileImage || undefined,
      },
      addresses: createClientDto.addresses ? createClientDto.addresses.map(addr => ({
        addressName: addr.addressName,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || undefined,
        location: addr.location,
        city: addr.city || undefined,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country || 'Australia',
        isPrimary: addr.isPrimary || false,
      })) : undefined,
      emergencyContacts: createClientDto.emergencyContacts ? createClientDto.emergencyContacts.map(contact => ({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        relationship: contact.relationship,
        phone: contact.phone,
      })) : undefined,
      settings: {
        emailNotifications: createClientDto.settings?.emailNotifications ?? true,
        smsNotifications: createClientDto.settings?.smsNotifications ?? true,
        marketingEmails: createClientDto.settings?.marketingEmails ?? false,
        clientType: (createClientDto.settings?.clientType as 'regular' | 'vip' | 'new') || 'regular',
        notes: createClientDto.settings?.notes || undefined,
        preferences: {
          preferredContactMethod: createClientDto.settings?.preferences?.preferredContactMethod || 'email',
          language: createClientDto.settings?.preferences?.language || 'en',
          timezone: createClientDto.settings?.preferences?.timezone || 'UTC',
        }
      }
    };

    const result = await this.clientService.createClient(clientFormData, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get()
  async getClients(
    @Request() req,
    @Query() filters: ClientFiltersDto,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Validate clientType to match allowed values
    const allowedTypes = ['regular', 'vip', 'new', 'all'] as const;
    const clientType: typeof allowedTypes[number] | undefined =
      filters.clientType && allowedTypes.includes(filters.clientType as any)
        ? filters.clientType as typeof allowedTypes[number]
        : undefined;

    // Ensure sortOrder is "asc", "desc", or undefined
    const allowedSortOrders = ['asc', 'desc'] as const;
    const sortOrder: typeof allowedSortOrders[number] | undefined =
      filters.sortOrder && allowedSortOrders.includes(filters.sortOrder as any)
        ? filters.sortOrder as typeof allowedSortOrders[number]
        : undefined;

    const result = await this.clientService.getClients(ownerId, {
      ...filters,
      clientType,
      sortOrder
    });
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get('search')
  async searchClients(
    @Request() req,
    @Query('q') query: string,
    @Query() filters: ClientFiltersDto,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Validate clientType to match allowed values
    const allowedTypes = ['regular', 'vip', 'new', 'all'] as const;
    const clientType: typeof allowedTypes[number] | undefined =
      allowedTypes.includes(filters.clientType as any)
        ? filters.clientType as typeof allowedTypes[number]
        : undefined;

    // Ensure sortOrder is "asc", "desc", or undefined
    const allowedSortOrders = ['asc', 'desc'] as const;
    const sortOrder: typeof allowedSortOrders[number] | undefined =
      filters.sortOrder && allowedSortOrders.includes(filters.sortOrder as any)
        ? filters.sortOrder as typeof allowedSortOrders[number]
        : undefined;

    const result = await this.clientService.getClients(ownerId, { 
      ...filters, 
      clientType,
      search: query,
      sortOrder
    });
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get(':clientId')
  async getClientDetails(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.clientService.getClientDetails(clientId, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }

  @Patch(':clientId')
async updateClient(
  @Request() req,
  @Param('clientId') clientId: string,
  @Body() updateClientDto: UpdateClientDto,
) {
  const ownerId = req.user.id;
  if (!ownerId) {
    throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
  }

  // Transform UpdateClientDto to match ClientEntity structure
  const updates: Partial<ClientEntity> = {
    // Profile updates
    ...(updateClientDto.profile && {
      firstName: updateClientDto.profile.firstName,
      lastName: updateClientDto.profile.lastName,
      email: updateClientDto.profile.email,
      phone: updateClientDto.profile.phone,
      dateOfBirth: updateClientDto.profile.dateOfBirth,
      gender: updateClientDto.profile.gender,
      pronouns: updateClientDto.profile.pronouns,
      occupation: updateClientDto.profile.occupation,
      clientSource: updateClientDto.profile.clientSource,
      profileImage: updateClientDto.profile.profileImage,
    }),
  };

  const result = await this.clientService.updateClient(clientId, ownerId, updates);
  
  if (!result.success) {
    throw new HttpException(
      { message: result.message, error: result.error },
      HttpStatus.BAD_REQUEST
    );
  }

  return result;
}

  @Delete(':clientId')
  async deleteClient(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.clientService.deleteClient(clientId, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Post('profile')
  async createClientProfile(
    @Request() req,
    @Body() profileData: any,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.clientProfileService.createClientProfile(profileData, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get(':clientId/profile')
  async getClientProfile(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.clientProfileService.getClientProfile(clientId, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }

  @Post('validate/profile')
  async validateClientProfile(
    @Body() profileData: any,
  ) {
    const result = await this.clientProfileService.validateClientProfile(profileData);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Post('addresses')
async addClientAddress(
  @Request() req,
  @Body() addressData: CreateClientAddressDto,
) {
  const ownerId = req.user.id;
  if (!ownerId) {
    throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
  }

  // Transform address data with required isPrimary value
  const transformedAddressData = {
    ...addressData,
    addressLine2: addressData.addressLine2 || '',
    city: addressData.city || '',
    client: { id: addressData.clientId } as ClientEntity,
    isPrimary: addressData.isPrimary || false, // Ensure isPrimary is always a boolean
  };

  const result = await this.clientAddressService.addClientAddress(transformedAddressData, ownerId);
  
  if (!result.success) {
    throw new HttpException(
      { message: result.message, error: result.error },
      HttpStatus.BAD_REQUEST
    );
  }

  return result;
}

  @Get(':clientId/addresses')
  async getClientAddresses(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.clientAddressService.getClientAddresses(clientId, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }

  @Post('emergency-contacts')
  async addEmergencyContact(
    @Request() req,
    @Body() contactData: CreateEmergencyContactDto,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    // Ensure client relation is included
    const contactDataWithRequiredLastName = {
      ...contactData,
      lastName: contactData.lastName,
      client: { id: contactData.clientId } as ClientEntity,
    };

    const result = await this.emergencyContactService.addEmergencyContact(contactDataWithRequiredLastName, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get(':clientId/emergency-contacts')
  async getEmergencyContacts(
    @Request() req,
    @Param('clientId') clientId: string,
  ) {
    const ownerId = req.user.id;
    if (!ownerId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.emergencyContactService.getEmergencyContacts(clientId, ownerId);
    
    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND
      );
    }

    return result;
  }
}