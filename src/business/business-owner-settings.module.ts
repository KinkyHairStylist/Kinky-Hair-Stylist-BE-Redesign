import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessOwnerSettings } from './entities/business-owner-settings.entity';
import { BusinessOwnerSettingsController } from './controllers/business-owner-settings.controller';
import { BusinessOwnerSettingsService } from './services/business-owner-settings.service';
import { UserModule } from 'src/user/modules/user.module';
import { Business } from './entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessOwnerSettings, Business]),
    UserModule,
  ],
  controllers: [BusinessOwnerSettingsController],
  providers: [BusinessOwnerSettingsService],
  exports: [BusinessOwnerSettingsService],
})
export class BusinessOwnerSettingsModule {}
