import {PartialType} from "@nestjs/mapped-types"
import { CreateGiftCardRequest } from './create-gift-card.request';
export class UpdateGiftCardRequest extends PartialType(CreateGiftCardRequest){

}
