import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Business, BusinessDocument } from '../schemas/business.schema';
import { Model } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { CreateBusinessDto } from '../dtos/requests/CreateBusinessDto';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private businessModel: Model<BusinessDocument>,
  ) {}

  /**
   * Creates a new business linked to the authenticated user.
   * @param createBusinessDto The data for the new business.
   * @param owner The user document of the business owner.
   * @returns The created business document.
   */
  async create(
    createBusinessDto: CreateBusinessDto,
    owner: UserDocument,
  ): Promise<BusinessDocument> {
    return new this.businessModel({
      ...createBusinessDto,
      owner: owner._id,
    }).save();
  }
}
