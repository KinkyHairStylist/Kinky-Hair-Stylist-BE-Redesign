import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GiftCardTemplate } from '../model/gift-card-template.entity';

@Injectable()
export class GiftCardTemplateRepository extends Repository<GiftCardTemplate> {
  constructor(private dataSource: DataSource) {
    super(GiftCardTemplate, dataSource.createEntityManager());
  }

  async findActiveTemplates(): Promise<GiftCardTemplate[]> {
    return this.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async findById(id: string): Promise<GiftCardTemplate | null> {
    return this.findOne({ where: { id, isActive: true } });
  }
}