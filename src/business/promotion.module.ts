import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientModule } from './client.module';
import { ClientSchema } from './entities/client.entity';
import { Promotion } from './entities/promotion.entity';
import { Business } from './entities/business.entity';
import { PromotionController } from './controllers/promotion.controller';
import { PromotionService } from './services/promotion.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Promotion, ClientSchema, Business]), // ✅ Load Reminder repository
    ClientModule,
    EmailModule,
  ],
  controllers: [PromotionController], // ✅ Expose controller
  providers: [PromotionService], // ✅ Provide service
  exports: [PromotionService], // ✅ Export if other modules need it
})
export class PromotionModule {}
