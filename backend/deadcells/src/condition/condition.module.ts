import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Condition } from 'src/entities/condition.entity';
import { ConditionController } from './condition.controller';
import { ConditionService } from './condition.service';
import { ConditionSeedService } from './seed/condition.seed';

@Module({
  imports: [TypeOrmModule.forFeature([Condition])],
  controllers: [ConditionController],
  providers: [ConditionService, ConditionSeedService],
  exports: [ConditionService],
})
export class ConditionModule {}
