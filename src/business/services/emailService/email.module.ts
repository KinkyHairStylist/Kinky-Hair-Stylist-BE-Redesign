import { Module } from '@nestjs/common';
import { IEmailService } from './interfaces/i.email.service';
import { MockEmailService } from './implementation/mock.email.service';

@Module({
  providers: [
    {
      provide: IEmailService,
      useClass: MockEmailService,
    },
  ],
  exports: [IEmailService],
})
export class EmailModule {}
