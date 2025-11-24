import { Module } from '@nestjs/common';
import { ZohoBooksCredentials } from '../entities/zohobooks-credentials.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZohoBooksService } from '../services/zohobooks.service';
import { ZohoBooksController } from './zohobooks.controller';
import { Appointment } from 'src/business/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, ZohoBooksCredentials])],
  providers: [ZohoBooksService],
  controllers: [ZohoBooksController],
  exports: [ZohoBooksService],
})
export class ZohoBooksModule {}
