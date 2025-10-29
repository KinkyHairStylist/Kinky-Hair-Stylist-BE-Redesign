import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class SubscribeMembershipDto {
  @ApiProperty({
    example: 'uuid-of-tier',
    description: 'The ID of the membership tier to subscribe to',
  })
  @IsUUID()
  @IsNotEmpty()
  tierId: string;
}
