import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session from 'express-session';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { InputSanitizationMiddleware } from './middleware/input-sanitization.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // frontend origin
    credentials: true,
  });

  // Input sanitization setup
  const sanitizer = new InputSanitizationMiddleware();
  app.use((req, res, next) => sanitizer.use(req, res, next));

  // Express session setup
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

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('KHS API')
    .setDescription('API documentation for KHS backend')
    .setVersion('1.0')
    .addBearerAuth() // adds JWT auth button in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // keeps JWT token between refreshes
    },
    customSiteTitle: 'KHS API Docs',
  });

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
