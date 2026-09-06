import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessGuidelineEntity } from './entities/business-guideline.entity';
import { UpdateGuidelineDto } from './DTOs/updateguideline.dto';

@Injectable()
export class GuidelinesService {
  constructor(
    @InjectRepository(BusinessGuidelineEntity)
    private readonly repo: Repository<BusinessGuidelineEntity>,
  ) {}

  /** Seed the default guideline sections the first time the table is empty. */
  private async ensureDefaults() {
    const count = await this.repo.count();
    if (count > 0) return;
    const defaults = [
      {
        title: 'Registration & Application',
        position: 0,
        items: [
          'Businesses must submit accurate and current information during registration.',
          'Applications are reviewed within 3–5 working days.',
          'Approved businesses must keep their profile and contact details up to date.',
        ],
      },
      {
        title: 'Services & Pricing',
        position: 1,
        items: [
          'List services with clear descriptions and accurate pricing.',
          'Prices that are unreasonable or misleading are subject to review.',
          'Service changes should reflect the current offer at all times.',
        ],
      },
      {
        title: 'Payments & Refunds',
        position: 2,
        items: [
          "All bookings must use the platform's payment and checkout flow.",
          'Refund requests must be resolved within the stated service level.',
          'Unresolved disputes are escalated to KHS support for review.',
        ],
      },
      {
        title: 'Staff & Management',
        position: 3,
        items: [
          'Assigned staff must be confirmed for every booking.',
          'Keep staff records, availability, and roles updated.',
          'Staff must comply with platform conduct standards.',
        ],
      },
      {
        title: 'Client Conduct & Reviews',
        position: 4,
        items: [
          'Respond to client reviews promptly and professionally.',
          'Encourage honest feedback; soliciting fake reviews is prohibited.',
          'Address client complaints visibly and within reasonable time.',
        ],
      },
      {
        title: 'Platform Compliance',
        position: 5,
        items: [
          'Do not use the platform for prohibited services or activities.',
          'Maintain hygiene, safety, and data privacy standards.',
          'Violations may result in account suspension or removal.',
        ],
      },
    ];
    await this.repo.save(defaults);
  }

  async getAll() {
    await this.ensureDefaults();
    return this.repo.find({ order: { position: 'ASC' } });
  }

  async update(id: string, dto: UpdateGuidelineDto) {
    const row = await this.repo.findOneBy({ id });
    if (!row) throw new NotFoundException('Guideline section not found');
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  /**
   * Full-replace semantics: the admin UI always sends the complete list of
   * sections, so we clear the table and reinsert in the given order. This
   * also drops any section the admin deleted on the frontend.
   */
  async updateAll(sections: UpdateGuidelineDto[]) {
    await this.repo.clear();
    const rows = sections.map((section, index) =>
      this.repo.create({
        title: section.title ?? '',
        items: section.items ?? [],
        position: index,
      }),
    );
    if (rows.length > 0) {
      await this.repo.save(rows);
    }
    return this.repo.find({ order: { position: 'ASC' } });
  }
}