import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessGuidelineEntity } from './entities/business-guideline.entity';
import { GuidelinesService } from './guidelines.service';
import { GuidelinesController } from './guidelines.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessGuidelineEntity])],
  controllers: [GuidelinesController],
  providers: [GuidelinesService],
  exports: [GuidelinesService],
})
export class GuidelinesModule {}