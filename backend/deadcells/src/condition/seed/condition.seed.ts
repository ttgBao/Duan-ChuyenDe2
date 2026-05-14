import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Condition } from 'src/entities/condition.entity';

@Injectable()
export class ConditionSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const conditionRepo = this.dataSource.getRepository(Condition);

    const existingCount = await conditionRepo.count();
    if (existingCount > 0) {
      console.log('Conditions already seeded. Skipping...');
      return;
    }

    const conditions = [
      { id: 1, name: 'Mới' },
      { id: 2, name: 'Như mới' },
      { id: 3, name: 'Tốt' },
      { id: 4, name: 'Khá' },
      { id: 5, name: 'Cũ' },
    ];

    for (const cond of conditions) {
      let savedCond = await conditionRepo.findOne({ where: { id: cond.id } });
      if (!savedCond) {
        await conditionRepo.save(cond);
      }
    }

    console.log('Seed conditions thành công!');
  }
}
