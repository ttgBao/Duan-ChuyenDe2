import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Rating } from 'src/entities/rating.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Rating)
    private readonly ratingRepo: Repository<Rating>,
  ) {}

  async findOne(id: number): Promise<User> {
    if (!id || isNaN(id)) {
      // Nếu id bị null, undefined hoặc NaN thì báo lỗi ngay, không gọi DB nữa
      throw new NotFoundException(`ID người dùng không hợp lệ (NaN/Null)`);
    }
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Người dùng với id ${id} không tồn tại`);
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find();
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    const allowedFields = [
      'fullName',
      'phone',
      'address_json',
      'hometown',
      'gender',
      'dob',
      'nickname',
      'bio',
      'is_cccd_verified',
      'verifiedAt',
      'image',
      'coverImage',
      'citizenId',
    ] as const;

    if (data.citizenId && data.citizenId !== user.citizenId) {
      const existingUser = await this.userRepo.findOne({
        where: { citizenId: data.citizenId },
      });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          'Số CCCD này đã được đăng ký bởi người khác',
        );
      }
    }

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        (user as any)[field] = data[field];
      }
    });

    if (data.is_cccd_verified === true && !user.is_cccd_verified) {
      user.is_cccd_verified = true;
      user.verifiedAt = new Date();
    }

    return this.userRepo.save(user);
  }

  async verifyCCCD(
    userId: number,
    cccdData: {
      fullName?: string;
      citizenId?: string;
      gender?: string;
      dob?: string;
      hometown?: string;
      address?: string;
      imageUrl?: string;
    },
  ): Promise<User> {
    console.log('CCCD DATA NHẬN VÀO:', cccdData);
    const updateData: Partial<User> = {
      is_cccd_verified: true,
      verifiedAt: new Date(),
    };

    if (cccdData.fullName) updateData.fullName = cccdData.fullName;
    if (cccdData.citizenId) updateData.citizenId = cccdData.citizenId;
    if (cccdData.gender) updateData.gender = cccdData.gender;
    if (cccdData.dob) {
      const date = new Date(cccdData.dob);
      if (!isNaN(date.getTime())) {
        updateData.dob = date;
      }
    }
    if (cccdData.hometown) updateData.hometown = cccdData.hometown;
    if (cccdData.address) {
      updateData.address_json = {
        full: cccdData.address,
        source: 'cccd_scan',
        updatedAt: new Date().toISOString(),
      };
    }

    if (cccdData.imageUrl) {
      updateData.image = cccdData.imageUrl;
    }
    console.log(updateData);

    return this.updateUser(userId, updateData);
  }
  async saveCCCDPending(
    userId: number,
    pendingData: {
      fullName?: string;
      citizenId?: string;
      gender?: string;
      dob?: string;
      hometown?: string;
      address?: string;
      imageUrl?: string;
      submittedAt?: Date;
    },
  ): Promise<User> {
    const user = await this.findOne(userId);

    // if (user.cccd_pending_data) {
    //   // Nếu đã có pending, không overwrite
    //   throw new BadRequestException(
    //     'Thông tin CCCD của bạn đang chờ admin duyệt',
    //   );
    // }

    user.cccd_pending_data = {
      ...pendingData,
      submittedAt: pendingData.submittedAt || new Date(),
    };

    return this.userRepo.save(user);
  }
  async getPendingCCCDRequests(): Promise<User[]> {
    return this.userRepo.find({
      where: {
        cccd_pending_data: Not(IsNull()),
      },
      select: ['id', 'fullName', 'cccd_pending_data'],
    });
  }

  async approveCCCD(userId: number): Promise<any> {
    const user = await this.findOne(userId);

    if (!user.cccd_pending_data) {
      throw new BadRequestException('Không có yêu cầu nào đang chờ duyệt');
    }

    const pending = user.cccd_pending_data;

    // Cập nhật dữ liệu thật từ pending
    const updateData: Partial<User> = {
      is_cccd_verified: true,
      verifiedAt: new Date(),
      fullName: pending.fullName || user.fullName,
      citizenId: pending.citizenId || user.citizenId,
      gender: pending.gender || user.gender,
      dob: pending.dob ? new Date(pending.dob) : user.dob,
      hometown: pending.hometown || user.hometown,
      address_json: pending.address
        ? { full: pending.address, source: 'cccd_scan', updatedAt: new Date() }
        : user.address_json,
      image: pending.imageUrl || user.image,
    };

    // Xóa pending sau khi duyệt
    user.cccd_pending_data = null;

    Object.assign(user, updateData);
    await this.userRepo.save(user);

    return { success: true, message: 'Đã phê duyệt thành công' };
  }

  async rejectCCCD(userId: number): Promise<any> {
    const user = await this.findOne(userId);

    if (!user.cccd_pending_data) {
      throw new BadRequestException('Không có yêu cầu nào đang chờ duyệt');
    }

    // Chỉ xóa pending, không thay đổi dữ liệu thật
    user.cccd_pending_data = null;
    await this.userRepo.save(user);

    return { success: true, message: 'Đã từ chối yêu cầu' };
  }

  async searchUsersForInvite(currentUserId: number | string, search?: string) {
    const userId = Number(currentUserId);
    if (isNaN(userId)) {
      throw new BadRequestException('User ID không hợp lệ');
    }

    const query = this.userRepo
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId: userId })
      .andWhere('user.deleted_at IS NULL')
      .andWhere('user.role_id = :roleId', { roleId: 2 }); // chỉ lấy user

    if (search) {
      query.andWhere('unaccent(user.nickname) ILIKE unaccent(:search)', {
        search: `%${search}%`,
      });
    }

    const users = await query
      .select(['user.id', 'user.nickname', 'user.image'])
      .getMany();

    return users.map((u) => ({
      id: u.id,
      name: u.nickname,
      avatar: u.image,
    }));
  }

  /** Tạo hoặc cập nhật đánh giá user */
  async rateUser(
    reviewerId: number,
    ratedUserId: number,
    stars: number,
    content?: string,
  ) {
    // Không cho tự đánh giá
    if (reviewerId === ratedUserId) {
      throw new BadRequestException('Không thể tự đánh giá bản thân');
    }

    // Kiểm tra user tồn tại
    const ratedUser = await this.userRepo.findOne({
      where: { id: ratedUserId },
    });
    if (!ratedUser) {
      throw new BadRequestException('User không tồn tại');
    }

    // Kiểm tra đã đánh giá chưa
    let rating = await this.ratingRepo.findOne({
      where: {
        user_id: reviewerId,
        rated_user_id: ratedUserId,
      },
    });

    if (rating) {
      // Cập nhật đánh giá cũ
      rating.number_stars = stars;
      rating.content = content || rating.content;
      await this.ratingRepo.save(rating);
      return {
        success: true,
        message: 'Đã cập nhật đánh giá',
        rating,
      };
    } else {
      // Tạo đánh giá mới
      rating = this.ratingRepo.create({
        user_id: reviewerId,
        rated_user_id: ratedUserId,
        number_stars: stars,
        content: content || '',
      });
      await this.ratingRepo.save(rating);
      return {
        success: true,
        message: 'Đã tạo đánh giá mới',
        rating,
      };
    }
  }

  /** Lấy danh sách đánh giá của user */
  async getUserRatings(userId: number) {
    const ratings = await this.ratingRepo
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.reviewer', 'reviewer')
      .where('rating.rated_user_id = :userId', { userId })
      .orderBy('rating.created_at', 'DESC')
      .getMany();

    return ratings.map((r) => ({
      id: r.id,
      stars: r.number_stars,
      content: r.content,
      createdAt: r.created_at,
      reviewer: {
        id: r.reviewer.id,
        name: r.reviewer.nickname,
        avatar: r.reviewer.image,
      },
    }));
  }

  /** Lấy rating trung bình của user */
  async getUserAverageRating(userId: number) {
    const result = await this.ratingRepo
      .createQueryBuilder('rating')
      .select('AVG(rating.number_stars)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.rated_user_id = :userId', { userId })
      .getRawOne();

    return {
      average: result.average ? parseFloat(result.average).toFixed(1) : null,
      count: parseInt(result.count) || 0,
    };
  }

  /** Kiểm tra user đã đánh giá chưa */
  async checkUserRating(reviewerId: number, ratedUserId: number) {
    const rating = await this.ratingRepo.findOne({
      where: {
        user_id: reviewerId,
        rated_user_id: ratedUserId,
      },
    });

    return rating
      ? {
          hasRated: true,
          stars: rating.number_stars,
          content: rating.content,
        }
      : { hasRated: false };
  }

  /** XÓA đánh giá (MỚI THÊM) */
  async deleteRating(reviewerId: number, ratedUserId: number) {
    if (reviewerId === ratedUserId) {
      throw new BadRequestException('Không thể xóa đánh giá của chính mình');
    }

    const rating = await this.ratingRepo.findOne({
      where: {
        user_id: reviewerId,
        rated_user_id: ratedUserId,
      },
    });

    if (!rating) {
      throw new BadRequestException('Bạn chưa đánh giá người dùng này');
    }

    await this.ratingRepo.remove(rating);

    return {
      success: true,
      message: 'Đã xóa đánh giá thành công',
    };
  }

  async getMyRatings(userId: number) {
    const cleanUserId = Number(userId);

    // Thêm kiểm tra an toàn ở đây
    if (isNaN(cleanUserId)) {
      throw new BadRequestException('User ID trong token không hợp lệ.');
    }

    const ratings = await this.ratingRepo.find({
      where: { reviewer: { id: userId } },
      relations: ['ratedUser'],
      order: { created_at: 'DESC' },
    });

    return ratings.map((r) => ({
      id: r.id,
      stars: Number(r.number_stars),
      content: r.content,
      createdAt: r.created_at,
      ratedUser: {
        id: r.ratedUser.id,
        nickname: r.ratedUser.nickname,
        image: r.ratedUser.image,
      },
    }));
  }

  /** Lấy cả đánh giá tôi nhận được và tôi đã cho */
  async getFeedback(userId: number) {
    const received = await this.getUserRatings(userId); // người khác đánh giá tôi
    const given = await this.getMyRatings(userId); // tôi đã đánh giá người khác

    return {
      received,
      given,
    };
  }
}
