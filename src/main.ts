import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { AuthMiddleware } from './middleware/anth.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { InputSanitizationMiddleware } from './middleware/input-sanitization.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ---------------------------------------------------
  // 🔹 GLOBAL PREFIX
  // ---------------------------------------------------
  app.setGlobalPrefix('api');

  // ---------------------------------------------------
  // 🔹 CORS (REQUIRED for cookies to work with Next.js)
  // ---------------------------------------------------
  app.enableCors({
    origin: 'http://localhost:3000',  // Next.js domain
    credentials: true,                // MUST BE TRUE for cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------
  // 🔹 Cookie Parser (MUST come BEFORE sessions & auth)
  // ---------------------------------------------------
  app.use(cookieParser());

  // ---------------------------------------------------
  // 🔹 Validation
  // ---------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS Configuration
  // const allowedOrigins = [
  //   'http://localhost:3000', // dev
  //   'https://sit.kinkyhairstylists.com', // staging
  //   'https://uat.kinkyhairstylists.com', // staging
  //   'https://www.kinkyhairstylists.com', // production
  // ];

  app.enableCors({
    // origin: (origin, callback) => {
    //   if (!origin || allowedOrigins.includes(origin)) {
    //     callback(null, true);
    //   } else {
    //     callback(new Error('Not allowed by CORS'));
    //   }
    // },
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Input sanitization setup
  const sanitizer = new InputSanitizationMiddleware();
  app.use((req, res, next) => sanitizer.use(req, res, next));

  // ---------------------------------------------------
  // 🔹 Session (MUST come AFTER cookieParser)
  // ---------------------------------------------------
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'super_secret_key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: false, // true in production (HTTPS)
        sameSite: 'lax', // REQUIRED for localhost cookies
      },
    }),
  );

  // ---------------------------------------------------
  // 🔹 PUBLIC ROUTES (skip authentication here)
  // ---------------------------------------------------
  const publicRoutes = [
    '/api/docs',
    '/api/auth/get-started',
    '/api/auth/verify-code',
    '/api/auth/resend-code',
    '/api/auth/signup',
    '/api/auth/login',
    '/api/admin/auth/login',
    '/api/auth/reset-password/start',
    '/api/auth/reset-password/verify',
    '/api/auth/reset-password/finish',
    '/api/auth/business/login',
    '/api/auth/business/otp/request',
    '/api/payments/verify',
    '/api/webhook/paystack',
    '/api/webhook/paypal',
  ];

  // ---------------------------------------------------
  // 🔹 GLOBAL AUTH MIDDLEWARE (AFTER cookies, BEFORE routes)
  // ---------------------------------------------------
  app.use((req, res, next) => {
    const isPublic = publicRoutes.some((route) => req.path.startsWith(route));

    if (isPublic) return next(); // Skip auth for public routes

    const authMiddleware = app.get(AuthMiddleware);
    return authMiddleware.use(req, res, next); // Protect all other routes
  });

  // ---------------------------------------------------
  // 🔹 SWAGGER
  // ---------------------------------------------------
  const config = new DocumentBuilder()
    .setTitle('KHS API')
    .setDescription('API documentation for KHS backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ---------------------------------------------------
  // 🔹 START SERVER
  // ---------------------------------------------------
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📘 Swagger Docs: http://localhost:${port}/api/docs`);
}

bootstrap();
