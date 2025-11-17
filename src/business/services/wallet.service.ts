import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import {
  AddPaymentMethodDto,
  AddTransactionDto,
  CreateWalletDto,
} from '../dtos/requests/WalletDto';
import { ApiResponse } from '../types/client.types';
import { Transaction } from '../entities/transaction.entity';
import {
  PaymentMethodType,
  WalletCurrency,
  WalletStatus,
} from 'src/admin/payment/enums/wallet.enum';

@Injectable()
export class BusinessWalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async createWalletForBusiness(
    createWalletDto: CreateWalletDto,
  ): Promise<ApiResponse<Wallet>> {
    try {
      // Check if wallet already exists for this business
      const existingWallet = await this.walletRepository.findOne({
        where: { businessId: createWalletDto.businessId },
      });

      if (existingWallet) {
        return {
          success: false,
          error: 'Wallet already exists for this business',
          message: 'Wallet already exists for this business',
        };
      }

      // Create new wallet
      const wallet = this.walletRepository.create({
        businessId: createWalletDto.businessId,
        ownerId: createWalletDto.ownerId,
        currency: createWalletDto.currency || WalletCurrency.NGN,
        description:
          createWalletDto.description || 'Business wallet - auto-created',
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        pendingBalance: 0,
        status: WalletStatus.ACTIVE,
        isVerified: false,
      });

      const savedWallet = await this.walletRepository.save(wallet);

      console.log('WALLET CREATED');

      // Create initial transaction record (wallet creation)
      // const initialTransaction = this.transactionRepository.create({
      //   walletId: savedWallet.id,
      //   amount: 0,
      //   type: 'credit',
      //   description: 'Wallet created',
      //   status: 'completed',
      // });

      // await this.transactionRepository.save(initialTransaction);

      // console.log('TRANSACTION CREATED');

      return {
        success: true,
        data: savedWallet,
        message: 'Business Wallet created successfully',
      };
    } catch (error) {
      console.log('Business Wallet creation error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create business wallet',
      };
    }
  }

  /**
   * Get wallet by business ID
   */
  async getWalletByBusinessId(businessId: string): Promise<Wallet> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { businessId },
        relations: ['transactions', 'paymentMethods'],
      });

      if (!wallet) {
        throw new BadRequestException(`Wallet not found`);
      }

      return wallet;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch business wallet by Business Id: ${error.message}`,
      );
    }
  }

  /**
   * Get wallet by owner ID
   */
  async getWalletByOwnerId(ownerId: string): Promise<ApiResponse<Wallet>> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { ownerId },
        relations: ['transactions', 'paymentMethods', 'business'],
      });

      if (!wallet) {
        return {
          success: false,
          error: 'Wallet not found',
          message: 'Wallet not found for this owner',
        };
      }

      return {
        success: true,
        data: wallet,

        message: 'Business Wallet fetched successfully',
      };
    } catch (error) {
      console.log('Failed to fetch business wallet error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch business wallet',
      };
    }
  }

  /**
   * Get wallet by ID with all relations
   */
  async getWalletById(walletId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
      relations: ['transactions', 'paymentMethods'],
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet not found`);
    }

    return wallet;
  }

  /**
   * Get wallet by ID with all relations
   */
  async getTransactionHistoryByWalletId(
    walletId: string,
  ): Promise<Transaction[]> {
    const transactionList = await this.transactionRepository.find({
      where: { walletId },
    });

    if (!transactionList) {
      throw new NotFoundException(`Transaction history not found`);
    }

    return transactionList;
  }

  /**
   * Add funds to wallet (credit transaction)
   */
  async addFunds(addTransactionDto: AddTransactionDto): Promise<Transaction> {
    if (addTransactionDto.type !== 'credit') {
      throw new BadRequestException(
        'Use addFunds for credit transactions only',
      );
    }

    return this.processTransaction(addTransactionDto);
  }

  /**
   * Deduct funds from wallet (debit transaction)
   */
  async deductFunds(
    addTransactionDto: AddTransactionDto,
  ): Promise<Transaction> {
    if (addTransactionDto.type !== 'debit') {
      throw new BadRequestException(
        'Use deductFunds for debit transactions only',
      );
    }

    const wallet = await this.getWalletByBusinessId(
      addTransactionDto.businessId,
    );

    // Check if sufficient balance
    if (wallet.balance < addTransactionDto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    return this.processTransaction(addTransactionDto);
  }

  /**
   * Process a transaction (credit or debit)
   */
  private async processTransaction(
    addTransactionDto: AddTransactionDto,
  ): Promise<Transaction> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { businessId: addTransactionDto.businessId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (wallet.status !== WalletStatus.ACTIVE) {
        throw new BadRequestException('Wallet is not active');
      }

      // Create transaction
      const transaction = this.transactionRepository.create({
        walletId: wallet.id,
        amount:
          addTransactionDto.type === 'credit'
            ? addTransactionDto.amount / 100
            : addTransactionDto.amount,
        type: addTransactionDto.type,
        description: addTransactionDto.description,
        referenceId: addTransactionDto.referenceId,
        status: 'completed',
        currency: addTransactionDto.currency,
        mode: addTransactionDto.mode,
        customerName: addTransactionDto.customerName,
      });

      const savedTransaction =
        await this.transactionRepository.save(transaction);

      // Update wallet balance
      if (addTransactionDto.type === 'credit') {
        wallet.balance =
          Number(wallet.balance) + Number(addTransactionDto.amount / 100);
        wallet.totalIncome =
          Number(wallet.totalIncome) + Number(addTransactionDto.amount / 100);

        console.log(`WALLET CREDITED ${addTransactionDto.amount / 100}`);
      } else {
        wallet.balance =
          Number(wallet.balance) - Number(addTransactionDto.amount);
        wallet.totalExpenses =
          Number(wallet.totalExpenses) + Number(addTransactionDto.amount);

        console.log(`WALLET DEBITED ${addTransactionDto.amount}`);
      }

      await this.walletRepository.save(wallet);

      return savedTransaction;
    } catch (error) {
      throw new InternalServerErrorException(
        `Transaction failed: ${error.message}`,
      );
    }
  }

  async addPayPalPaymentMethod(
    walletId: string,
    paypalEmail: string,
    isDefault: boolean = true,
  ): Promise<PaymentMethod> {
    const wallet = await this.getWalletById(walletId);

    // Check if PayPal already exists for this wallet
    const existingPayPal = await this.paymentMethodRepository.findOne({
      where: {
        walletId: wallet.id,
        type: PaymentMethodType.DIGITAL_WALLET,
        provider: 'PayPal',
      },
    });

    if (existingPayPal) {
      throw new BadRequestException(
        'PayPal payment method already exists for this wallet',
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await this.paymentMethodRepository.update(
        { walletId: wallet.id, isDefault: true },
        { isDefault: false },
      );
    }

    // Create PayPal payment method
    const paymentMethod = this.paymentMethodRepository.create({
      walletId: wallet.id,
      type: PaymentMethodType.DIGITAL_WALLET,
      provider: 'PayPal',
      accountNumber: paypalEmail,
      isDefault: isDefault,
      isActive: true,
    });

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async addPaymentMethod(
    addPaymentMethodDto: AddPaymentMethodDto,
  ): Promise<ApiResponse<PaymentMethod>> {
    try {
      const wallet = await this.getWalletById(addPaymentMethodDto.walletId);

      // If this is set as default, unset other defaults
      if (addPaymentMethodDto.isDefault) {
        await this.paymentMethodRepository.update(
          { walletId: wallet.id, isDefault: true },
          { isDefault: false },
        );
      }

      const paymentMethod = this.paymentMethodRepository.create({
        ...addPaymentMethodDto,
      });

      const newPaymentMethod =
        await this.paymentMethodRepository.save(paymentMethod);

      return {
        success: true,
        data: newPaymentMethod,
        message: 'Payment Method added successfully',
      };
    } catch (error) {
      console.log('Failed to add payment method to business error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add payment method to business',
      };
    }
  }

  async getAvailablePaymentMethodTypes(): Promise<
    Array<{
      type: PaymentMethodType;
      name: string;
      description: string;
      isEnabled: boolean;
    }>
  > {
    return [
      {
        type: PaymentMethodType.DIGITAL_WALLET,
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        isEnabled: true,
      },
      {
        type: PaymentMethodType.BANK_ACCOUNT,
        name: 'Bank Account',
        description: 'Direct bank account transfer',
        isEnabled: false, // Can enable when implemented
      },
      {
        type: PaymentMethodType.CREDIT_CARD,
        name: 'Credit Card',
        description: 'Pay with credit card',
        isEnabled: false, // Can enable when implemented
      },
      {
        type: PaymentMethodType.DEBIT_CARD,
        name: 'Debit Card',
        description: 'Pay with debit card',
        isEnabled: false, // Can enable when implemented
      },
    ];
  }

  /**
   * Get all payment methods for a wallet
   */
  async getPaymentMethods(
    walletId: string,
  ): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      await this.getWalletById(walletId); // Validate wallet exists

      const paymentMethods = await this.paymentMethodRepository.find({
        where: { walletId, isActive: true },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });

      return {
        success: true,
        data: paymentMethods,
        message: 'Payment Methods list retrieved successfully',
      };
    } catch (error) {
      console.log('Failed to fetch payment methods error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch payment methods',
      };
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Soft delete by marking as inactive
    paymentMethod.isActive = false;
    await this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(
    paymentMethodId: string,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset other defaults for this wallet
    await this.paymentMethodRepository.update(
      { walletId: paymentMethod.walletId, isDefault: true },
      { isDefault: false },
    );

    // Set this as default
    paymentMethod.isDefault = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: string): Promise<number> {
    const wallet = await this.getWalletById(walletId);
    return Number(wallet.balance);
  }

  /**
   * Update wallet status
   */
  async updateWalletStatus(
    walletId: string,
    status: WalletStatus,
  ): Promise<Wallet> {
    const wallet = await this.getWalletById(walletId);
    wallet.status = status;
    return this.walletRepository.save(wallet);
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(
    walletId: string,
    limit: number = 50,
  ): Promise<ApiResponse<Transaction[]>> {
    try {
      const transactionList = await this.transactionRepository.find({
        where: { walletId },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      return {
        success: true,
        data: transactionList,
        message: 'Transaction history fetched',
      };
    } catch (error) {
      console.log('Failed to fetch Transaction history error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fetch Transaction history',
      };
    }
  }
}
