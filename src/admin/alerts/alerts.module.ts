import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemAlert } from './entities/system-alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { PublicAlertsController } from './public-alerts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SystemAlert])],
  controllers: [AlertsController, PublicAlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
