import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // Xóa người dùng vĩnh viễn
  async deleteUser(id: number) {
    const user = await this.findOne(id);
    return this.userRepo.delete(id); 
  }

  // 1. Lấy danh sách user (Phân trang, tìm kiếm, lọc status)
  async getAllUsers(
    page: number,
    limit: number,
    search: string,
    status: string,
  ) {
    const skip = (page - 1) * limit;
    const query = this.userRepo.createQueryBuilder('user');

    // Tìm kiếm theo tên, email, sđt
    if (search) {
      query.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR "user"."phone" ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Lọc theo trạng thái (ví dụ: verified, locked)
    if (status === 'verified') {
      query.andWhere('user.is_cccd_verified = :verified', { verified: true });
    } else if (status === 'unverified') {
      query.andWhere('user.is_cccd_verified = :verified', { verified: false });
    }
    // Note: Nếu bạn có cột isActive hoặc isLocked thì thêm logic lọc ở đây

    query.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [users, total] = await query.getManyAndCount();

    return {
      data: users,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  // 2. Xem chi tiết user + lịch sử đăng bài
  async getUserDetail(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['products'], // Giả sử relation tên là products hoặc posts
    });

    if (!user) throw new NotFoundException('User không tồn tại');
    return user;
  }

  async findOne(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User không tồn tại');
    return user;
  }

  // Lấy danh sách user đang chờ duyệt CCCD
  async getPendingUsers() {
    return this.userRepo.find({
      where: { cccd_pending_data: Not(IsNull()) },
      select: ['id', 'fullName', 'cccd_pending_data'],
    });
  }

  // Duyệt CCCD pending
  async approveCCCDPending(userId: number) {
    const user = await this.findOne(userId);
    if (!user.cccd_pending_data)
      throw new BadRequestException('User không có CCCD pending');

    // Cập nhật trạng thái verified
    user.is_cccd_verified = true;
    user.verifiedAt = new Date();

    // Có thể copy dữ liệu từ pending sang user chính
    const pending = user.cccd_pending_data;
    if (pending.fullName) user.fullName = pending.fullName;
    if (pending.citizenId) user.citizenId = pending.citizenId;
    if (pending.gender) user.gender = pending.gender;
    if (pending.dob) user.dob = new Date(pending.dob);
    if (pending.hometown) user.hometown = pending.hometown;
    if (pending.address) user.address_json = pending.address;
    if (pending.imageUrl) user.image = pending.imageUrl;

    // Xoá pending
    user.cccd_pending_data = null;

    return this.userRepo.save(user);
  }

  // Từ chối CCCD pending
  async rejectCCCDPending(userId: number) {
    const user = await this.findOne(userId);
    if (!user.cccd_pending_data)
      throw new BadRequestException('User không có CCCD pending');

    // Xoá file ảnh nếu có
    const imagePath = user.cccd_pending_data?.imageUrl;
    if (imagePath) {
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(__dirname, '..', '..', imagePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // Xoá pending
    user.cccd_pending_data = null;
    return this.userRepo.save(user);
  }

  // Lấy toàn bộ danh sách nhóm cho Admin
  async getAllGroups() {
    const groups = await this.groupRepo.find({
      relations: ['owner'],
      order: { created_at: 'DESC' },
    });

    return Promise.all(
      groups.map(async (group) => {
        const memberCount = await this.groupMemberRepo.count({
          where: { group_id: group.id, pending: 3 },
        });
        const productCount = await this.productRepo.count({
          where: { group_id: group.id },
        });
        return {
          id: group.id,
          name: group.name,
          description: group.description,
          thumbnail_url: group.thumbnail_url,
          isPublic: group.isPublic,
          mustApprovePosts: group.mustApprovePosts,
          created_at: group.created_at,
          memberCount,
          productCount,
          owner: group.owner ? {
            id: group.owner.id,
            nickname: group.owner.nickname,
            fullName: group.owner.fullName,
            email: group.owner.email,
          } : null,
        };
      }),
    );
  }

  // Admin xóa nhóm vĩnh viễn
  async deleteGroup(id: number) {
    const group = await this.groupRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    // Xóa các dữ liệu liên quan
    await this.groupMemberRepo.delete({ group_id: id });
    await this.productRepo.delete({ group_id: id });

    // Xóa nhóm
    return this.groupRepo.delete(id);
  }
}
