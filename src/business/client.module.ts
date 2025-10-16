import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './controllers/client.controller';
import { ClientService } from './services/client.service';
import { ClientProfileService } from './services/client-profile.service';
import { ClientAddressService } from './services/client-address.service';
import { EmergencyContactService } from './services/emergency-contact.service';

// Import entities
import { ClientEntity } from './entities/client.entity';
import { ClientAddressEntity } from './entities/client-address.entity';
import { EmergencyContactEntity } from './entities/emergency-contact.entity';
import { ClientSettingsEntity } from './entities/client-settings.entity';
import { BusinessEntity } from './entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientEntity,
      ClientAddressEntity,
      EmergencyContactEntity,
      ClientSettingsEntity,
      BusinessEntity,
    ]),
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    ClientProfileService,
    ClientAddressService,
    EmergencyContactService,
  ],
  exports: [ClientService],
})
export class ClientModule {}