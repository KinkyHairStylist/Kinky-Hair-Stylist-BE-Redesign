// src/seed2.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SalonSeed2 } from './salon-seed2';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const salonSeed = app.get(SalonSeed2);
  
  try {
    await salonSeed.run();
    console.log('🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
