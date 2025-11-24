import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from 'src/business/entities/appointment.entity';
import { QuickBooksController } from './controllers/quick-books.controller';
import { QuickBooksService } from './services/quick-books.service';
import { QuickBooksCredentials } from './entities/quick-books.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, QuickBooksCredentials])],
  providers: [QuickBooksService],
  controllers: [QuickBooksController],
  exports: [QuickBooksService],
})
export class QuickBooksModule {}
