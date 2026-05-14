import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostType } from '../entities/post-type.entity';
import { PostTypeController } from './post-type.controller';
import { PostTypeService } from './post-type.service';
import { PostTypeSeedService } from './seed/post-type.seed';

@Module({
    imports: [TypeOrmModule.forFeature([PostType])],
    controllers: [PostTypeController],
    providers: [PostTypeService, PostTypeSeedService],
    exports: [PostTypeService],
})
export class PostTypeModule { }