import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductStatus } from 'src/entities/product-status.entity';

@Injectable()
export class ProductStatusSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const productStatusRepo = this.dataSource.getRepository(ProductStatus);

    const existingCount = await productStatusRepo.count();
    if (existingCount > 0) {
      console.log('ProductStatuses already seeded. Skipping...');
      return;
    }

    const statuses = [
      { id: 1, name: 'Chờ duyệt' },
      { id: 2, name: 'Đã duyệt' },
      { id: 3, name: 'Bị từ chối' },
      { id: 4, name: 'Đã ẩn' },
      { id: 5, name: 'Hết hạn' },
      { id: 6, name: 'Đã bán' },
    ];

    for (const status of statuses) {
      let savedStatus = await productStatusRepo.findOne({ where: { id: status.id } });
      if (!savedStatus) {
        await productStatusRepo.save(status);
      }
    }

    console.log('Seed product statuses thành công!');
  }
}
