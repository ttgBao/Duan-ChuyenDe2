import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class CategorySeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const categoryRepo = this.dataSource.getRepository(Category);

    // Kiểm tra xem đã có danh mục nào chưa
    const existingCount = await categoryRepo.count();
    if (existingCount > 0) {
      console.log('Categories already seeded. Skipping...');
      return;
    }

    const categories = [
      {
        id: 1,
        name: 'Thiết bị điện tử',
        image: 'https://cdn-icons-png.flaticon.com/512/3659/3659899.png',
        hot: true,
      },
      {
        id: 2,
        name: 'Đồ dùng học tập',
        image: 'https://cdn-icons-png.flaticon.com/512/3145/3145765.png',
        hot: true,
      },
      {
        id: 3,
        name: 'Phương tiện đi lại',
        image: 'https://cdn-icons-png.flaticon.com/512/1048/1048313.png',
        hot: true,
      },
      {
        id: 4,
        name: 'Đồ gia dụng',
        image: 'https://cdn-icons-png.flaticon.com/512/2589/2589903.png',
        hot: false,
      },
      {
        id: 5,
        name: 'Thời trang',
        image: 'https://cdn-icons-png.flaticon.com/512/3159/3159614.png',
        hot: false,
      },
      {
        id: 6,
        name: 'Giải trí & Thể thao',
        image: 'https://cdn-icons-png.flaticon.com/512/857/857418.png',
        hot: false,
      },
      {
        id: 7,
        name: 'Thú cưng',
        image: 'https://cdn-icons-png.flaticon.com/512/3093/3093952.png',
        hot: false,
      },
      {
        id: 8,
        name: 'Khác',
        image: 'https://cdn-icons-png.flaticon.com/512/3067/3067272.png',
        hot: false,
      }
    ];

    for (const cat of categories) {
      let savedCat = await categoryRepo.findOne({ where: { id: cat.id } });
      if (!savedCat) {
        await categoryRepo.save(cat);
      }
    }

    console.log('Seed categories thành công!');
  }
}
