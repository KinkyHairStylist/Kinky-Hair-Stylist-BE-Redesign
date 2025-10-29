import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PasswordValidation (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  const validSignUpDto = {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    surname: 'User',
    phoneNumber: '+2348123456789',
    gender: 'Male',
  };

  it('/api/sign-up (POST) should return 400 for missing password', async () => {
    const { password, ...dtoWithoutPassword } = validSignUpDto;
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send(dtoWithoutPassword)
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message).toContain('password should not be empty');
  });

  it('/api/sign-up (POST) should return 400 for a password less than 8 characters', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send({ ...validSignUpDto, password: 'Pass1!' })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message[0]).toContain('Password must contain at least one lowercase letter');
  });

  it('/api/sign-up (POST) should return 400 for a password without an uppercase letter', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send({ ...validSignUpDto, password: 'password123!' })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message[0]).toContain('Password must contain at least one lowercase letter');
  });

  it('/api/sign-up (POST) should return 400 for a password without a lowercase letter', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send({ ...validSignUpDto, password: 'PASSWORD123!' })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message[0]).toContain('Password must contain at least one lowercase letter');
  });

  it('/api/sign-up (POST) should return 400 for a password without a number', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send({ ...validSignUpDto, password: 'Password!' })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message[0]).toContain('Password must contain at least one lowercase letter');
  });

  it('/api/sign-up (POST) should return 400 for a password without a special character', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/sign-up')
      .send({ ...validSignUpDto, password: 'Password123' })
      .expect(400);

    expect(response.body.message).toBeInstanceOf(Array);
    expect(response.body.message[0]).toContain('Password must contain at least one lowercase letter');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
