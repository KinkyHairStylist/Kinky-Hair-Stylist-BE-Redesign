import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'a-very-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 3600000 * 24 * 7, // 1 week
      },
    }),
  );

  const port = 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on http://localhost:${port}`);
}

bootstrap();
