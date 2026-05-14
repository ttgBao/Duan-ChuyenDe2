import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SubCategory } from 'src/entities/sub-category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectRepository(SubCategory)
    private readonly subCategoryRepo: Repository<SubCategory>,
  ) {}

  async findAll() {
    return this.subCategoryRepo.find();
  }

  async findOne(id: number) {
    const sub = await this.subCategoryRepo.findOne({ where: { id } });
    if (!sub) throw new BadRequestException('Sub-category not found');
    return sub;
  }

  async findWithSource(id: number) {
    return this.findOne(id);
  }

  // sub-category.service.ts
  async create(data: Partial<SubCategory>) {
    if (!data.parent_category_id) {
      throw new BadRequestException('parent_category_id is required');
    }

    // LOẠI BỎ id HOÀN TOÀN (dù string hay number)
    const { id, ...cleanData } = data as any;

    const result = await this.subCategoryRepo
      .createQueryBuilder()
      .insert()
      .into(SubCategory)
      .values({
        name: cleanData.name,
        category_id: Number(cleanData.parent_category_id),
        parent_category_id: Number(cleanData.parent_category_id),
        source_table: cleanData.source_table || 'categories',
        source_id: cleanData.source_id ?? null,
      })
      .returning([
        'id',
        'name',
        'category_id',
        'parent_category_id',
        'created_at',
        'updated_at',
      ])
      .execute();

    return result.generatedMaps[0] as SubCategory;
  }

  async update(id: number, data: Partial<SubCategory>) {
    if (data.parent_category_id) {
      data.category_id = data.parent_category_id; // Cập nhật cả 2
    }

    await this.subCategoryRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    const subId = Number(id);
    if (isNaN(subId)) {
      throw new BadRequestException('ID danh mục con không hợp lệ');
    }

    const result = await this.subCategoryRepo.delete(subId);

    if (result.affected === 0) {
      throw new BadRequestException('Danh mục con không tồn tại');
    }

    return {
      message:
        'Xóa danh mục con và tất cả sản phẩm, hình ảnh liên quan thành công',
      deletedId: subId,
    };
  }

  async findByCategory(category_id: number) {
    return this.subCategoryRepo.find({
      where: { category_id: category_id },
      relations: ['category'],
    });
  }
}
