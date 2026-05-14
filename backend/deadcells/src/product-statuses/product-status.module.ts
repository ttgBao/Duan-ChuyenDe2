import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductStatus } from 'src/entities/product-status.entity';
import { ProductStatusService } from './product-status.service';
import { ProductStatusController } from './product-status.controller';
import { ProductStatusSeedService } from './seed/product-status.seed';

@Module({
  imports: [TypeOrmModule.forFeature([ProductStatus])], 
  providers: [ProductStatusService, ProductStatusSeedService], 
  controllers: [ProductStatusController], 
  exports: [ProductStatusService], 
})
export class ProductStatusModule {}