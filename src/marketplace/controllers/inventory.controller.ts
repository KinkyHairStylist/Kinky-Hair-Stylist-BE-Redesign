import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { AddCategoryDto, UpdateCategoriesDto } from '../dto/marketplace.dto';

@Controller('marketplace')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('inventory/summary')
  async getPlatformSummary(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.inventoryService.getPlatformInventorySummary();

      return {
        success: true,
        data: result,
        message: 'Inventory summary fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch Inventory summary',
      };
    }
  }

  @Get('inventory/business/summary')
  async getBusinessSummary(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result =
        await this.inventoryService.getBusinessInventorySummary(ownerId);

      return {
        success: true,
        data: result,
        message: 'Business Inventory summary fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch Inventory categories list',
      };
    }
  }

  @Get('/low-stock')
  async getLowStockProducts(@Query('limit') limit?: number) {
    return await this.inventoryService.getLowStockProducts(limit);
  }

  @Get('inventory/business/low-stock')
  async getBusinessLowStockProducts(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result =
        await this.inventoryService.getBusinessLowStockProducts(ownerId);

      return {
        success: true,
        data: result,
        message: 'Inventory low stocks list fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch Inventory low stocks',
      };
    }
  }

  @Get('/category-breakdown')
  async getCategoryBreakdown() {
    return await this.inventoryService.getInventoryValueByCategory();
  }

  @Get('/top-businesses')
  async getTopBusinesses(@Query('limit') limit?: number) {
    return await this.inventoryService.getTopBusinessesByInventoryValue(limit);
  }

  @Get('/restock-needed')
  async getRestockNeeded(@Query('threshold') threshold?: number) {
    return await this.inventoryService.getProductsNeedingRestock(threshold);
  }

  @Get('inventory/categories-list')
  async getCategoriesList(@Request() req) {
    try {
      const ownerId = req.user.sub || req.user.userId;

      if (!ownerId) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.inventoryService.getCategoriesList();

      return {
        success: true,
        data: result,
        message: 'Inventory categories list fetched',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: error.message || 'Failed to fetch Inventory categories list',
      };
    }
  }

  // -------------------------
  // Bulk update categories
  // -------------------------
  @Put('inventory/categories')
  async updateCategoriesList(@Body() dto: UpdateCategoriesDto) {
    return this.inventoryService.updateCategoriesList(dto.categories);
  }

  // -------------------------
  // Add single category
  // -------------------------
  @Post('inventory/categories/add')
  async addCategory(@Body() dto: AddCategoryDto) {
    return this.inventoryService.addCategory(dto.category);
  }
}
