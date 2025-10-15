import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemGiftCardRequest {

  @IsString()
  @IsNotEmpty()
  code: string
}
