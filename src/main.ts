import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import createMongoStore from 'connect-mongodb-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Session configuration
  const MongoDBStore = createMongoStore(session);
  const store = new MongoDBStore({
    uri: process.env.MONGODB_URI,
    collection: 'sessions',
  });

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'khs-session-secret',
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();