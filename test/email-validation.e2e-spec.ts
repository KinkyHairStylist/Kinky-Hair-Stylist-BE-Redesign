import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('EmailValidationMiddleware (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/get-started (POST) should return 400 for missing email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/get-started')
      .send({ phone: '1234567890' })
      .expect(400);

    expect(response.body.message).toBe('Email is required');
  });

  it('/api/get-started (POST) should return 400 for invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/get-started')
      .send({ email: 'invalid-email' })
      .expect(400);

    expect(response.body.message).toBe('Invalid email format');
  });

  it('/api/get-started (POST) should proceed for valid email', async () => {
    await request(app.getHttpServer())
      .post('/api/get-started')
      .send({ email: 'test@example.com' })
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});