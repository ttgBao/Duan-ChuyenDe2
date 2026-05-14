import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SubCategory } from 'src/entities/sub-category.entity';
import { Category } from 'src/entities/category.entity';

@Injectable()
export class SubCategorySeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const subCategoryRepo = this.dataSource.getRepository(SubCategory);
    const categoryRepo = this.dataSource.getRepository(Category);

    // Chờ CategorySeedService chạy trước nếu chưa có Category
    const categoryCount = await categoryRepo.count();
    if (categoryCount === 0) {
      console.log('Waiting 3s for CategorySeedService to finish...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Kiểm tra xem đã có danh mục con nào chưa
    const existingCount = await subCategoryRepo.count();
    if (existingCount > 0) {
      console.log('SubCategories already seeded. Skipping...');
      return;
    }

    const subCategories = [
      // 1: Thiết bị điện tử
      { name: 'Điện thoại', category_id: 1 },
      { name: 'Laptop', category_id: 1 },
      { name: 'Máy tính bảng', category_id: 1 },
      { name: 'Phụ kiện điện tử', category_id: 1 },
      
      // 2: Đồ dùng học tập
      { name: 'Sách giáo trình', category_id: 2 },
      { name: 'Dụng cụ học tập', category_id: 2 },
      { name: 'Balo, cặp xách', category_id: 2 },

      // 3: Phương tiện đi lại
      { name: 'Xe máy', category_id: 3 },
      { name: 'Xe đạp', category_id: 3 },
      { name: 'Xe điện', category_id: 3 },
      { name: 'Phụ kiện xe', category_id: 3 },

      // 4: Đồ gia dụng
      { name: 'Quạt, máy lạnh', category_id: 4 },
      { name: 'Thiết bị nhà bếp', category_id: 4 },
      { name: 'Đồ nội thất, trang trí', category_id: 4 },

      // 5: Thời trang
      { name: 'Quần áo nam', category_id: 5 },
      { name: 'Quần áo nữ', category_id: 5 },
      { name: 'Giày dép', category_id: 5 },
      { name: 'Phụ kiện thời trang', category_id: 5 },

      // 6: Giải trí & Thể thao
      { name: 'Dụng cụ thể thao', category_id: 6 },
      { name: 'Nhạc cụ', category_id: 6 },
      { name: 'Sách truyện, Đĩa game', category_id: 6 },

      // 7: Thú cưng
      { name: 'Chó cưng', category_id: 7 },
      { name: 'Mèo cưng', category_id: 7 },
      { name: 'Thức ăn, phụ kiện thú cưng', category_id: 7 },

      // 8: Khác
      { name: 'Sản phẩm khác', category_id: 8 },
    ];

    for (const subCat of subCategories) {
      let savedSubCat = await subCategoryRepo.findOne({ 
        where: { name: subCat.name, category_id: subCat.category_id } 
      });
      if (!savedSubCat) {
        await subCategoryRepo.save(subCat);
      }
    }

    console.log('Seed sub-categories thành công!');
  }
}
