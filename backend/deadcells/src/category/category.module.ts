import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/entities/category.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { SubCategory } from 'src/entities/sub-category.entity';
import { CategorySeedService } from './seed/category.seed';
import { SubCategorySeedService } from './seed/sub-category.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Category, SubCategory])],
  controllers: [CategoryController],
  providers: [CategoryService, CategorySeedService, SubCategorySeedService],
})
export class CategoryModule { }
