import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../../all_user_entities/card.entity';
import { CreateCardDto } from '../dtos/create-card.dto';
import { User } from '../../all_user_entities/user.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
  ) {}

  async createCard(dto: CreateCardDto, user: User): Promise<Card> {
    // derive last four digits
    const lastFour = dto.cardNumber.slice(-4);

    const newCard = this.cardRepo.create({
      providerName: dto.providerName,
      type: dto.type,
      cardHolderName: dto.cardHolderName,
      cardNumber: dto.cardNumber, // will be encrypted automatically
      expiryMonth: dto.expiryMonth,
      expiryYear: dto.expiryYear,
      cvv: dto.cvv,
      billingAddress: dto.billingAddress,
      lastFourDigits: lastFour,
      user,
    });

    return await this.cardRepo.save(newCard);
  }

  async getAllAuthCards(user: User): Promise<Card[]> {
    return this.cardRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' }, // optional: show most recent first
    });
  }

  async getAllCards(): Promise<Card[]> {
    return this.cardRepo.find();
  }
}
