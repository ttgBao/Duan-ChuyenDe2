import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DealType } from 'src/entities/deal-type.entity';

@Injectable()
export class DealTypeSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const dealTypeRepo = this.dataSource.getRepository(DealType);

    const existingCount = await dealTypeRepo.count();
    if (existingCount > 0) {
      console.log('DealTypes already seeded. Skipping...');
      return;
    }

    const dealTypes = [
      { id: 1, name: 'Giá bán' },
      { id: 2, name: 'Trao đổi' },
      { id: 3, name: 'Miễn phí' },
    ];

    for (const deal of dealTypes) {
      let savedDeal = await dealTypeRepo.findOne({ where: { id: deal.id } });
      if (!savedDeal) {
        await dealTypeRepo.save(deal);
      }
    }

    console.log('Seed deal types thành công!');
  }
}
