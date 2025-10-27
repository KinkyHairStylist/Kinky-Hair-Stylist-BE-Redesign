import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment-controller';
import { PaymentService } from './payment.service';
import { PaymentMethod } from './payment-method.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentMethod])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}