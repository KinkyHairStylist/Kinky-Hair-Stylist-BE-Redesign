import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal } from './entities/withdrawal.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';
import { ILike } from 'typeorm';
import { BusinessGiftCard } from 'src/business/entities/business-giftcard.entity';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,

    @InjectRepository(BusinessGiftCard)
    private readonly giftCardRepo: Repository<BusinessGiftCard>, // 👈 inject giftcard repo
  ) {}

  // ✅ Get all withdrawals
  async findAll(): Promise<Withdrawal[]> {
    return this.withdrawalRepo.find({ order: { createdAt: 'DESC' } });
  }

  // ✅ Get withdrawal details by ID
  async findOne(id: string): Promise<Withdrawal> {
    const withdrawal = await this.withdrawalRepo.findOne({ where: { id } });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');
    return withdrawal;
  }

  // ✅ Create a new withdrawal request

  async create(dto: CreateWithdrawalDto): Promise<Withdrawal> {
    const businessName = dto.businessName.trim();

    const giftcard = await this.giftCardRepo.findOne({
      where: { business: { businessName: businessName } },
    });

    if (!giftcard) {
      throw new NotFoundException(`Gift card not found for business: ${dto.businessName}`);
    }

    if (giftcard.amount < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    giftcard.remainingAmount -= dto.amount;
    await this.giftCardRepo.save(giftcard);

    const withdrawal = this.withdrawalRepo.create({
      ...dto,
      status: 'Pending',
      currentBalance: giftcard.remainingAmount,
      requestDate: new Date().toISOString(),
    });

    return this.withdrawalRepo.save(withdrawal);
  }


  // ✅ Approve and process payout
  async approve(id: string): Promise<Withdrawal> {
    const withdrawal = await this.findOne(id);
    withdrawal.status = 'Processing';
    await this.withdrawalRepo.save(withdrawal);

    // Simulate payout processing delay
    setTimeout(async () => {
      withdrawal.status = 'Completed';
      await this.withdrawalRepo.save(withdrawal);
    }, 3000);

    return withdrawal;
  }

  // ✅ Reject withdrawal
  async reject(id: string): Promise<Withdrawal> {
    const withdrawal = await this.findOne(id);
    withdrawal.status = 'Rejected';
    return this.withdrawalRepo.save(withdrawal);
  }

  // ✅ Get pending withdrawals
  async getPending(): Promise<Withdrawal[]> {
    return this.withdrawalRepo.find({ where: { status: 'Pending' } });
  }

   // 🗑️ Delete all withdrawal requests
  async deleteAll(): Promise<{ message: string }> {
    await this.withdrawalRepo.clear();
    return { message: 'All withdrawal requests have been deleted successfully' };
  }
}
