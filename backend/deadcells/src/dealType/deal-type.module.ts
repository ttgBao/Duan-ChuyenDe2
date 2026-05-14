import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealType } from 'src/entities/deal-type.entity';
import { DealTypeController } from './deal-type.controller';
import { DealTypeService } from './deal-type.service';
import { DealTypeSeedService } from './seed/dealType.seed';

@Module({
  imports: [TypeOrmModule.forFeature([DealType])],
  controllers: [DealTypeController],
  providers: [DealTypeService, DealTypeSeedService],
  exports: [DealTypeService],
})
export class DealTypeModule {}
