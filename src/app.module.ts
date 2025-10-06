import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './business/business.module';
import { EmailModule } from './business/services/emailService/email.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb+srv://Esther:Esther2004@cluster0.byfqhoj.mongodb.net/KHS_BE?retryWrites=true&w=majority&appName=Cluster0'),
    BusinessModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
