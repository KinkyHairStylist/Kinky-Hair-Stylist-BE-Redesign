import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import {
  AddPaymentMethodDto,
  CreateWalletDto,
} from '../dtos/requests/WalletDto';
import { BusinessWalletService } from '../services/wallet.service';

@Controller('business-wallet')
// @UseGuards(JwtAuthGuard)
export class BusinessWalletController {
  constructor(private readonly walletService: BusinessWalletService) {}

  @Post('/wallet')
  async createWallet(
    @Request() req,
    @Body() createWalletData: CreateWalletDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result =
      await this.walletService.createWalletForBusiness(createWalletData);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Get('/wallet')
  async getWalletByOwnerId(@Request() req) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.walletService.getWalletByOwnerId(ownerId);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('/add-payment-method')
  async addPaymentMethod(
    @Request() req,
    @Body() paymentMethodData: AddPaymentMethodDto,
  ) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.walletService.addPaymentMethod(paymentMethodData);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Get('/payment-method-list/:walletId')
  async getWalletPaymentMethodList(
    @Request() req,
    @Param('walletId') walletId: string,
  ) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.walletService.getPaymentMethods(walletId);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Get('/transaction-history/:walletId')
  async getTransactionHistory(
    @Request() req,
    @Param('walletId') walletId: string,
  ) {
    const ownerId = req.user.sub || req.user.userId;

    if (!ownerId) {
      throw new HttpException(
        'User not authenticated',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.walletService.getTransactionHistory(walletId);

    if (!result.success) {
      throw new HttpException(
        { message: result.message, error: result.error },
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }
}
