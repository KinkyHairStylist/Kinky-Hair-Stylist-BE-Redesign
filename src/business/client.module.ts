import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientController } from './controllers/client.controller';
import { ClientService } from './services/client.service';
import { ClientProfileService } from './services/client-profile.service';
import { ClientAddressService } from './services/client-address.service';
import { EmergencyContactService } from './services/emergency-contact.service';
import { ClientModel, ClientSchema } from './schemas/client.schema';
import { ClientAddressModel, ClientAddressSchema } from './schemas/client-address.schema';
import { EmergencyContact } from './schemas/emergency-contact.schema';
import { ClientSettingsModel, ClientSettingsSchema } from './schemas/client-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClientModel.name, schema: ClientSchema },
      { name: ClientAddressModel.name, schema: ClientAddressSchema },
      { name: EmergencyContact.name, schema: EmergencyContact },
      { name: ClientSettingsModel.name, schema: ClientSettingsSchema },
      { name: 'Business', schema: require('./schemes/business.schema').BusinessSchema },
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
