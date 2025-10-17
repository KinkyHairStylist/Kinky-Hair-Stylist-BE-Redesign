import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { BusinessModule } from './business/business.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    BusinessModule,
  ],
})
export class AppModule {}
