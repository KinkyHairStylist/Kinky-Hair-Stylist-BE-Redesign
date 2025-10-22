import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { SalonModule } from './user/salon/salon.module';
import { BookingModule } from './user/salon/booking/booking.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { SeedsModule } from './user/salon/seeds/seed.module';
import { typeOrmConfig } from './config/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UserModule,
    SalonModule,
    SeedsModule,
    BookingModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
