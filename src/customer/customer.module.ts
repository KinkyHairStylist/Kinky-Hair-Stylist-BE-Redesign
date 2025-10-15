import { Module } from '@nestjs/common';
import { GiftCardModule } from './gift-card.module';

@Module({
  imports: [GiftCardModule],
})
export class CustomerModule {}
