// src/seed.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SalonSeed } from './salon-seed';
import { ImageSeed } from './image-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const salonSeed = app.get(SalonSeed);
  const imageSeed = app.get(ImageSeed);

  try {
    await salonSeed.run();
    await imageSeed.run();
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
