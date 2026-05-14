import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/entities/product.entity';
import { ProductImage } from 'src/entities/product-image.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { DealType } from 'src/entities/deal-type.entity';
import { Condition } from 'src/entities/condition.entity';
import { SubCategory } from 'src/entities/sub-category.entity';
import { Category } from 'src/entities/category.entity';
import { FashionCategory } from 'src/entities/categories/fashion-category.entity';
import { GameCategory } from 'src/entities/categories/game-category.entity';
import { AcademicCategory } from 'src/entities/categories/academic-category.entity';
import { AnimalCategory } from 'src/entities/categories/animal-category.entity';
import { ElectronicCategory } from 'src/entities/categories/electronic-category.entity';
import { HouseCategory } from 'src/entities/categories/house-category.entity';
import { VehicleCategory } from 'src/entities/categories/vehicle-category.entity';
import { PostType } from 'src/entities/post-type.entity';
import { User } from 'src/entities/user.entity';
import { GroupModule } from 'src/groups/group.module';
import { NotificationModule } from 'src/notification/notification.module';
import { SizeModule } from 'src/size/size.module';
import { BrandModule } from 'src/brands/brand.module';
import { OriginModule } from 'src/origin/origin.module';
import { MaterialModule } from 'src/material/material.module';
import { ColorModule } from 'src/colors/color.module';
import { CapacityModule } from 'src/capacitys/capacity.module';
import { WarrantyModule } from 'src/warrantys/warranty.module';
import { ProductModelModule } from 'src/product-models/product-model.module';
import { ProcessorModule } from 'src/processors/processor.module';
import { RamOptionModule } from 'src/ram-options/ram-option.module';
import { StorageTypeModule } from 'src/storage-types/storage-type.module';
import { GraphicsCardModule } from 'src/graphics-cards/graphics-card.module';
import { BreedModule } from 'src/breeds/breed.module';
import { AgeRangeModule } from 'src/age-ranges/age-range.module';
import { GenderModule } from 'src/genders/gender.module';
import { EngineCapacityModule } from 'src/engine-capacities/engine-capacity.module';
import { ProductTypeModule } from 'src/product-types/product-type.module';
import { ProductStatusModule } from 'src/product-statuses/product-status.module';
import { GroupMember } from 'src/entities/group-member.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Favorite } from 'src/entities/favorite.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from 'src/users/users.module';
import { AiModule } from 'src/ai/ai.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      User,
      DealType,
      Condition,
      SubCategory,
      Category,
      FashionCategory,
      GameCategory,
      AcademicCategory,
      AnimalCategory,
      ElectronicCategory,
      HouseCategory,
      VehicleCategory,
      PostType,
      GroupMember,
      Favorite,
    ]),
      UsersModule,
    ScheduleModule.forRoot(),
    NotificationModule,
    forwardRef(() => GroupModule),
    SizeModule,
    BrandModule,
    OriginModule,
    MaterialModule,
    ColorModule,
    CapacityModule,
    WarrantyModule,
    ProductModelModule,
    ProcessorModule,
    RamOptionModule,
    StorageTypeModule,
    GraphicsCardModule,
    BreedModule,
    AgeRangeModule,
    GenderModule,
    EngineCapacityModule,
    ProductTypeModule,
    ProductStatusModule,
    AuthModule,
    AiModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
