import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Group } from 'src/entities/group.entity';
import { GroupMember } from 'src/entities/group-member.entity';

@Injectable()
export class GroupSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const groupRepo = this.dataSource.getRepository(Group);
    const groupMemberRepo = this.dataSource.getRepository(GroupMember);
    const userRepo = this.dataSource.getRepository('User');

    const existingGroupCount = await groupRepo.count();
    if (existingGroupCount > 0) {
      console.log('Groups already seeded. Skipping...');
      return;
    }

    let owner = await userRepo.findOne({ where: { email: 'admin@fit.tdc.edu.vn' } });
    if (!owner) {
      console.log('Owner not found, waiting 3s for UserSeedService...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      owner = await userRepo.findOne({ where: { email: 'admin@fit.tdc.edu.vn' } });
      if (!owner) {
        console.log('Admin user still not found. Skipping group seed.');
        return;
      }
    }

    const ownerId = owner.id;

    const groups = [
      {
        id: 1,
        name: 'KHOA CÔNG NGHỆ THÔNG TIN',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về lập trình, hệ thống và mạng',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 2,
        name: 'KHOA ĐỘNG LỰC',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về tài chính, kế toán, quản trị',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 3,
        name: 'KHOA ĐÔNG PHƯƠNG',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về y học, điều dưỡng, dược phẩm',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 4,
        name: 'KHOA Ô TÔ',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về tiếng Nhật',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 5,
        name: 'KHOA CƠ KHÍ',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về tiếng Anh',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 6,
        name: 'KHOA CÔNG NGHỆ TỰ ĐỘNG',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về pháp luật, tư pháp, hành chính',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 7,
        name: 'KHOA KINH TẾ',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành đào tạo giáo viên các cấp',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 8,
        name: 'KHOA DU LỊCH - KHÁCH SẠN',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành về trồng trọt, chăn nuôi, thủy sản',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 9,
        name: 'KHOA TIẾNG ANH',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành thiết kế, kiến trúc, đồ họa',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
      {
        id: 10,
        name: 'KHOA ĐIỆN - ĐIỆN TỬ',
        owner_id: ownerId,
        mustApprovePosts: true,
        description: 'Nhóm ngành dịch vụ, quản lý du lịch và khách sạn',
        thumbnail_url:
          'https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-truong-cao-dang-cong-nghe-thu-duc-tdc.png',
        status_id: 1,
        isPublic: true,
      },
    ];

    for (const group of groups) {
      // 1. Kiểm tra nhóm đã tồn tại chưa
      let savedGroup = await groupRepo.findOne({ where: { id: group.id } });

      // 2. Nếu chưa, tạo nhóm
      if (!savedGroup) {
        savedGroup = await groupRepo.save(group);
      }

      // 3. Kiểm tra member đã tồn tại chưa
      const memberExists = await groupMemberRepo.findOne({
        where: {
          group_id: savedGroup.id,
          user_id: ownerId,
        },
      });

      if (!memberExists) {
        await groupMemberRepo.save({
          group_id: savedGroup.id,
          user_id: ownerId,
          group_role_id: 2,
          pending: 3,
        });
      }
    }

    console.log(' Seed groups thành công!.');
  }
}
