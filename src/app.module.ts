import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from './business/business.module';
import { EmailModule } from './business/services/emailService/email.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://Esther:Esther2004@cluster0.byfqhoj.mongodb.net/KHS_BE?retryWrites=true&w=majority&appName=Cluster0',
    ),
    BusinessModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    const connectionState = mongoose.connection.readyState;
    if (connectionState === 1) {
      console.log('✅ MongoDB connected successfully');
    } else {
      mongoose.connection.once('connected', () => {
        console.log('✅ MongoDB connected successfully');
      });
    }

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
  }
}
