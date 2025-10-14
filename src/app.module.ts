import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module'; // Add this
import { GiftcardService } from './giftcard/giftcard.service';
import { GiftcardModule } from './giftcard/giftcard.module';

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
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    GiftcardModule, 
  ],
  providers: [],
})
export class AppModule {}