import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ElectronicCategoryModule } from './category/category-detail/electronic/electronic-category.module';
import { AcademicCategoryModule } from './category/category-detail/academic/academic-category.module';
import { FashionCategoryModule } from './category/category-detail/fashion/fashion-category.module';
import { HouseCategoryModule } from './category/category-detail/house/house-category.module';
import { AnimalCategoryModule } from './category/category-detail/animal/animal-category.module';
import { VehicleCategoryModule } from './category/category-detail/vehicle/vehicle-category.module';
import { GameCategoryModule } from './category/category-detail/game/game-category.module';
import { ProductImageModule } from './product-image/product-image.module';
import { ConditionModule } from './condition/condition.module';
import { DealTypeModule } from './dealType/deal-type.module';
import { SubCategoryModule } from './sub-category/sub-category.module';
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './report/report.module';
import { ConfigModule } from '@nestjs/config';
import { ProductTypeModule } from './product-types/product-type.module';
import { PostTypeModule } from './post-type/post-type.module';
import { CommentModule } from './comment/comment.module';
import { ChatModule } from './chat/chat.module';
import { UsersModule } from './users/users.module';
import { GroupModule } from './groups/group.module';
import { FavoritesModule } from './favorites/favorites.module';
import { OriginModule } from './origin/origin.module';
import { MaterialModule } from './material/material.module';
import { SizeModule } from './size/size.module';
import { BrandModule } from './brands/brand.module';
import { ColorModule } from './colors/color.module';
import { WarrantyModule } from './warrantys/warranty.module';
import { CapacityModule } from './capacitys/capacity.module';
import { ProductModelModule } from './product-models/product-model.module';
import { ProcessorModule } from './processors/processor.module';
import { RamOptionModule } from './ram-options/ram-option.module';
import { StorageTypeModule } from './storage-types/storage-type.module';
import { GraphicsCardModule } from './graphics-cards/graphics-card.module';
import { BreedModule } from './breeds/breed.module';
import { AgeRangeModule } from './age-ranges/age-range.module';
import { GenderModule } from './genders/gender.module';
import { EngineCapacityModule } from './engine-capacities/engine-capacity.module';
import { ProductStatus } from './entities/product-status.entity';
import { GroupMember } from './entities/group-member.entity';
import { ProductStatusModule } from './product-statuses/product-status.module';
import { AdminModule } from './admin/admin.module';
import { NotificationModule } from './notification/notification.module';
import { FollowModule } from './follow/follow.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    ProductModule,
    CategoryModule,
    ElectronicCategoryModule,
    AcademicCategoryModule,
    FashionCategoryModule,
    HouseCategoryModule,
    AnimalCategoryModule,
    VehicleCategoryModule,
    GameCategoryModule,
    ProductImageModule,
    ConditionModule,
    DealTypeModule,
    SubCategoryModule,
    AuthModule,
    ReportModule,
    ProductTypeModule,
    PostTypeModule,
    CommentModule,
    UsersModule,
    ChatModule,
    GroupModule,
    FavoritesModule,
    FollowModule,
    OriginModule,
    MaterialModule,
    SizeModule,
    BrandModule,
    ColorModule,
    CapacityModule,
    WarrantyModule,
    ProductModelModule,
    ProcessorModule,
    RamOptionModule,
    StorageTypeModule,
    GraphicsCardModule,
    NotificationModule,
    BreedModule,
    AgeRangeModule,
    GenderModule,
    EngineCapacityModule,
    ProductStatusModule,
    AdminModule,
    AiModule,
  ],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
