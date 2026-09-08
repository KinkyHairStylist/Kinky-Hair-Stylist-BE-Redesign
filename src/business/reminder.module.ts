import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reminder } from './entities/reminder.entity';
import { ReminderService } from './services/reminder.service';
import { ReminderController } from './controllers/reminder.controller';
import { ClientModule } from './client.module';
import { ClientSchema } from './entities/client.entity';
import { Business } from './entities/business.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reminder, ClientSchema, Business]), // ✅ Load Reminder repository
    ClientModule,
    EmailModule,
  ],
  controllers: [ReminderController], // ✅ Expose controller
  providers: [ReminderService], // ✅ Provide service
  exports: [ReminderService], // ✅ Export if other modules need it
})
export class ReminderModule {}
