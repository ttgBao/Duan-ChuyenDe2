import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PostType } from 'src/entities/post-type.entity';

@Injectable()
export class PostTypeSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const postTypeRepo = this.dataSource.getRepository(PostType);

    const existingCount = await postTypeRepo.count();
    if (existingCount > 0) {
      console.log('PostTypes already seeded. Skipping...');
      return;
    }

    const postTypes = [
      { id: 1, name: 'Đăng bán' },
      { id: 2, name: 'Đăng mua' },
    ];

    for (const postType of postTypes) {
      let savedPostType = await postTypeRepo.findOne({ where: { id: postType.id } });
      if (!savedPostType) {
        await postTypeRepo.save(postType);
      }
    }

    console.log('Seed post types thành công!');
  }
}
