import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './controllers/client.controller';
import { ClientService } from './services/client.service';
import { ClientProfileService } from './services/client-profile.service';
import { ClientAddressService } from './services/client-address.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { ClientSchema } from './entities/client.entity';
import { ClientAddressSchema } from './entities/client-address.entity';
import { EmergencyContactSchema } from './entities/emergency-contact.entity';
import { ClientSettingsSchema } from './entities/client-settings.entity';
import { Business } from './entities/business.entity';
import { ClientSettingsService } from './services/client-settings.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientSchema,
      ClientAddressSchema,
      EmergencyContactSchema,
      ClientSettingsSchema,
      Business,
    ]),
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    ClientProfileService,
    ClientAddressService,
    EmergencyContactService,
    ClientSettingsService,
  ],
  exports: [ClientService],
})
export class ClientModule {}
