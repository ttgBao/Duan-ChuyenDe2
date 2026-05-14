import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, FindManyOptions, In } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Product } from 'src/entities/product.entity';
import { NotificationAction } from 'src/entities/notification-action.entity';
import { TargetType } from 'src/entities/target-type.entity';
import { NotificationGateway } from './notification.gateway';
import { User } from 'src/entities/user.entity';
import { GroupMember } from 'src/entities/group-member.entity';
import { Follower } from 'src/entities/follower.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationAction)
    private readonly actionRepo: Repository<NotificationAction>,
    @InjectRepository(TargetType)
    private readonly targetTypeRepo: Repository<TargetType>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follower)
    private readonly followerRepo: Repository<Follower>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Xóa tất cả thông báo liên quan đến một sản phẩm cụ thể.
   * Dùng khi sản phẩm bị Ẩn, Xóa, hoặc Hết hạn.
   */
  async deleteNotificationsByProductId(productId: number) {
    try {
      const result = await this.notificationRepo.delete({
        product: { id: productId },
      });
      this.logger.log(
        `🗑️ Đã xóa ${result.affected} thông báo liên quan đến Product ID ${productId} (do sản phẩm không còn Active)`,
      );
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa thông báo theo productId ${productId}: ${error.message}`,
      );
    }
  }

  // Thông báo cho các người bán
  async notifySellersOfBuyRequest(
    newBuyPost: Product,
    sellerIds: number[],
  ) {
    if (!sellerIds || sellerIds.length === 0) return;

    try {
      const ACTION_NAME = 'matching_buy_request';

      // 1. Tìm xem action này đã có trong DB chưa
      let action = await this.actionRepo.findOne({
        where: { name: ACTION_NAME },
      });

      // 🟢 TỰ ĐỘNG TẠO: Nếu chưa có thì tạo mới luôn (Bạn không cần chạy SQL tay)
      if (!action) {
        this.logger.log(`Action '${ACTION_NAME}' chưa tồn tại, đang tạo mới...`);
        const newAction = this.actionRepo.create({ name: ACTION_NAME });
        action = await this.actionRepo.save(newAction);
      }

      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });

      // 2. Tạo thông báo cho từng người bán
      const notifications = sellerIds.map((sellerId) => {
        // Không gửi cho chính mình
        if (sellerId === newBuyPost.user_id) return null;

        const dto: CreateNotificationDto = {
          userId: sellerId,                 // Người nhận: Người đang bán
          actorId: Number(newBuyPost.user_id), // Người gây ra: Người đăng mua
          actionId: action.id,
          targetTypeId: targetType.id,
          targetId: newBuyPost.id,          // Bấm vào sẽ ra bài đăng mua
          productId: newBuyPost.id,
        };
        // Gọi hàm create có sẵn để lưu và push socket
        return this.create(dto); 
      });

      await Promise.all(notifications);
      this.logger.log(`Đã gửi thông báo "${ACTION_NAME}" tới ${sellerIds.length} người bán.`);
      
    } catch (error) {
      this.logger.error(`Lỗi gửi thông báo matching_buy_request: ${error.message}`);
    }
  }

  /**
   * Hàm này được gọi bởi các service khác (CommentService, MessageService...)
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const newNotification = this.notificationRepo.create({
      user: { id: dto.userId },
      actor: { id: dto.actorId },
      action: { id: dto.actionId },
      targetType: { id: dto.targetTypeId },
      target_id: dto.targetId,
      product: dto.productId ? { id: dto.productId } : undefined,
      group: dto.groupId ? { id: dto.groupId } : undefined,
      is_read: false,
    });
    // LƯU LẦN 1
    const savedNotification = await this.notificationRepo.save(newNotification);

    // GỌI HÀM PUSH SAU KHI TẠO
    this.pushNewUnreadCount(dto.userId);

    //  Trả về cái đã lưu, không save 2 lần
    return savedNotification;
  }

  /** Thông báo lời mời tham gia nhóm */
  async notifyGroupInvitation(
    inviteeId: number,
    inviterId: number,
    groupId: number,
    invitationId: number,
  ) {
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'group_invitation',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'group',
      });

      const dto: CreateNotificationDto = {
        userId: inviteeId, // Người nhận thông báo
        actorId: inviterId, // Người mời
        actionId: action.id,
        targetTypeId: targetType.id,
        targetId: invitationId, // ID của invitation
        groupId: groupId,
      };

      await this.create(dto);
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo group_invitation: ${error.message}`,
        error.stack,
      );
    }
  }

  // Thông báo cho chính người đăng
  async notifyUserOfPostSuccess(product: Product) {
    const statusId = product.productStatus?.id || product.product_status_id;

    if (statusId !== 2) {
      this.logger.log(
        `Sản phẩm ID ${product.id} có status là ${statusId} (Chưa duyệt). Không gửi thông báo post_success.`,
      );
      return;
    }
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'post_success',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });
      const dto: CreateNotificationDto = {
        userId: Number(product.user_id),
        actorId: Number(product.user_id),
        actionId: action.id,
        targetTypeId: targetType.id,
        targetId: product.id,
        productId: product.id,
      };
      await this.create(dto);
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo post_success: ${error.message}`,
        error.stack,
      );
    }
  }

  // Thông báo cho người bị theo dõi
  async notifyUserOfNewFollower(actorId: number, followedUserId: number) {
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'new_follow',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'user',
      });
      const dto: CreateNotificationDto = {
        userId: followedUserId,
        actorId: actorId,
        actionId: action.id,
        targetTypeId: targetType.id,
        targetId: actorId,
        productId: undefined,
      };
      await this.create(dto);
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo new_follow: ${error.message}`,
        error.stack,
      );
    }
  }

  // Thông báo cho TẤT CẢ FOLLOWER khi user đăng bài mới
  async notifyFollowersOfNewPost(product: Product) {
    try {
      const authorId = Number(product.user_id);

      // 1. Tìm action 'following_new_post'
      const action = await this.actionRepo.findOneBy({
        name: 'following_new_post',
      });
      if (!action) {
        this.logger.warn(' Không tìm thấy action "following_new_post".');
        return;
      }

      // 2. Tìm targetType 'product'
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });

      // 3. Lấy danh sách người đang follow author này
      const followers = await this.followerRepo.find({
        where: { following: { id: authorId } },
        relations: ['follower'],
      });

      if (followers.length === 0) {
        this.logger.log(`User ${authorId} không có follower nào.`);
        return;
      }

      this.logger.log(
        `📢 Gửi thông báo bài mới đến ${followers.length} follower của user ${authorId}`,
      );

      // 4. Tạo thông báo cho từng follower
      const notificationPromises = followers
        .filter((f) => f.follower.id !== authorId) // Không gửi cho chính mình
        .map((f) => {
          const dto: CreateNotificationDto = {
            userId: f.follower.id, // Người NHẬN (follower)
            actorId: authorId, // Người ĐĂNG BÀI
            actionId: action.id,
            targetTypeId: targetType.id,
            targetId: product.id,
            productId: product.id,
          };
          return this.create(dto);
        });

      await Promise.allSettled(notificationPromises);
      this.logger.log(
        `Đã gửi thông báo bài mới cho ${followers.length} follower.`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Lỗi notifyFollowersOfNewPost: ${error.message}`,
        error.stack,
      );
    }
  }

  // HÀM: Thông báo cho chủ sản phẩm khi có người thích
  async notifyProductOwnerOfFavorite(
    actorId: number,
    productId: number,
    productOwnerId: number,
  ) {
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'favorite_product',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });
      const dto: CreateNotificationDto = {
        userId: productOwnerId,
        actorId: actorId,
        actionId: action.id,
        targetTypeId: targetType.id,
        targetId: productId,
        productId: productId,
      };
      await this.create(dto); // 👈 Hàm create() ở trên sẽ tự động push
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo favorite_product: ${error.message}`,
        error.stack,
      );
    }
  }

  // HÀM: Gửi xác nhận cho người vừa thả tim
  async notifyUserOfFavoriteConfirmation(actorId: number, productId: number) {
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'favorite_confirmation',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });
      const dto: CreateNotificationDto = {
        userId: actorId,
        actorId: actorId,
        actionId: action.id,
        targetTypeId: targetType.id,
        targetId: productId,
        productId: productId,
      };
      await this.create(dto); // 👈 Hàm create() ở trên sẽ tự động push
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo favorite_confirmation: ${error.message}`,
        error.stack,
      );
    }
  }

  // HÀM: Thông báo cho (Admin)
  async notifyAdminsOfNewPost(product: Product) {
    try {
      const action = await this.actionRepo.findOneByOrFail({
        name: 'admin_new_post',
      });
      const targetType = await this.targetTypeRepo.findOneByOrFail({
        name: 'product',
      });
      const admins = await this.userRepo.findBy({ roleId: 1 });
      if (admins.length === 0) {
        this.logger.warn('Không tìm thấy Admin (role_id=1) để gửi thông báo.');
        return;
      }
      const notifications = admins.map((admin) => {
        if (admin.id === product.user_id) return null;
        const dto: CreateNotificationDto = {
          userId: admin.id,
          actorId: Number(product.user_id),
          actionId: action.id,
          targetTypeId: targetType.id,
          targetId: product.id,
          productId: product.id,
        };
        return this.create(dto); // 👈 Hàm create() ở trên sẽ tự động push
      });
      await Promise.allSettled(notifications.filter((n) => n !== null));
    } catch (error) {
      this.logger.error(
        `Lỗi tạo thông báo admin_new_post: ${error.message}`,
        error.stack,
      );
    }
  }

  // HÀM: Xóa thông báo khi người dùng Bỏ thích (Hủy tim)
  async deleteNotificationOnUnlike(
    actorId: number,
    productId: number,
    productOwnerId: number,
  ) {
    try {
      const confirmAction = await this.actionRepo.findOneBy({
        name: 'favorite_confirmation',
      });
      const productAction = await this.actionRepo.findOneBy({
        name: 'favorite_product',
      });
      const targetType = await this.targetTypeRepo.findOneBy({
        name: 'product',
      });
      if (!confirmAction || !productAction || !targetType) {
        this.logger.warn(
          `Không tìm thấy action/target type để xóa thông báo 'unlike'`,
        );
        return;
      }

      // 1. Xóa thông báo XÁC NHẬN (của người thả tim)
      await this.notificationRepo.delete({
        user: { id: actorId },
        actor: { id: actorId },
        action: { id: confirmAction.id },
        targetType: { id: targetType.id },
        target_id: productId,
      });
      // ✅ THÊM PUSH (cho người thả tim)
      this.pushNewUnreadCount(actorId);

      // 2. Xóa thông báo CHO CHỦ BÀI
      if (actorId !== productOwnerId) {
        await this.notificationRepo.delete({
          user: { id: productOwnerId },
          actor: { id: actorId },
          action: { id: productAction.id },
          targetType: { id: targetType.id },
          target_id: productId,
        });
        // ✅ THÊM PUSH (cho chủ bài)
        this.pushNewUnreadCount(productOwnerId);
      }
      this.logger.log(
        `Đã xóa thông báo 'unlike' cho actor ${actorId} và product ${productId}`,
      );
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa thông báo 'unlike': ${error.message}`,
        error.stack,
      );
    }
  }

  // HÀM: Xóa tất cả thông báo
  async deleteAllForUser(userId: number) {
    try {
      const deleteResult = await this.notificationRepo.delete({
        user: { id: userId },
      });

      // ✅ THÊM PUSH
      this.pushNewUnreadCount(userId);

      this.logger.log(
        `Đã xóa ${deleteResult.affected} thông báo cho user ${userId}`,
      );
      return {
        message: 'Đã xóa tất cả thông báo.',
        count: deleteResult.affected,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa thông báo cho user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // HÀM: Lấy tất cả thông báo (cho app React Native)
  async getNotificationsForUser(
    userId: number,
    tab?: string,
  ): Promise<Notification[]> {
    // 1. Đây là phần quan trọng nhất: Tải tất cả các relations
    // mà frontend cần để hiển thị.
    const relationsToLoad = [
      'user',
      'actor', // Cần cho item.actor.fullName
      'action', // Cần cho item.action.name
      'targetType', // Cần cho item.targetType.name
      'product', // Cần cho thông báo sản phẩm
      'group', // Cần cho thông báo lời mời nhóm
    ];

    // 2. Cấu hình query cơ bản
    const queryOptions: FindManyOptions<Notification> = {
      where: {
        user: { id: userId },
      },
      relations: relationsToLoad,
      order: { createdAt: 'DESC' },
      take: 50, // Luôn giới hạn số lượng
    };

    // 3.  Khai báo mảng các action cho tab Tin tức(bài viết admin và bài viết được follow)
    const newsActions = ['admin_new_post', 'following_new_post'];

    if (tab === 'news') {
      // Nếu là tab "Tin tức", chỉ lấy action "admin_new_post"
      queryOptions.where = {
        ...queryOptions.where,
        action: { name: In(newsActions) },
      };
    } else {
      // Nếu là tab "Hoạt động" (mặc định), lấy TẤT CẢ TRỪ "admin_new_post"
      queryOptions.where = {
        ...queryOptions.where,
        action: { name: Not(In(newsActions)) },
      };
    }

    // 4. Tìm và trả về
    const rawNotifications = await this.notificationRepo.find(queryOptions);

    return Promise.all(
      rawNotifications.map(async (n) => {
        const base: any = {
          id: n.id,
          is_read: n.is_read,
          createdAt: n.createdAt,
          actor: n.actor,
          action: n.action,
          group: n.group,
          product: n.product,
          targetType: n.targetType,
          target_id: n.target_id,
        };

        if (n.action?.name === 'group_invitation' && n.group?.id) {
          const membership = await this.groupMemberRepo.findOne({
            where: {
              user_id: userId,
              group_id: n.group.id,
            },
            select: ['pending'],
          });

          base.invitationStatus =
            membership?.pending === 3
              ? 'accepted'
              : membership?.pending === 1
                ? 'rejected'
                : 'pending';
        }

        return base;
      }),
    );
  }

  // HÀM: Đánh dấu một thông báo là đã đọc
  async markAsRead(notificationId: number, userId: number) {
    const updateResult = await this.notificationRepo.update(
      { id: notificationId, user: { id: userId } },
      { is_read: true },
    );

    // ✅ THÊM PUSH
    this.pushNewUnreadCount(userId);

    return updateResult;
  }

  // HÀM: Đánh dấu TẤT CẢ là đã đọc
  async markAllAsRead(userId: number) {
    try {
      const updateResult = await this.notificationRepo.update(
        { user: { id: userId }, is_read: false },
        { is_read: true },
      );

      // ✅ THÊM PUSH
      this.pushNewUnreadCount(userId);

      this.logger.log(
        `Đã đánh dấu ${updateResult.affected} thông báo là đã đọc cho user ${userId}`,
      );
      return {
        message: 'Đã đánh dấu tất cả là đã đọc.',
        count: updateResult.affected,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi đánh dấu tất cả là đã đọc: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // HÀM: Lấy SỐ LƯỢNG chưa đọc
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    try {
      const count = await this.notificationRepo.count({
        where: {
          user: { id: userId },
          is_read: false,
        },
      });
      return { count };
    } catch (error) {
      this.logger.error(
        `Lỗi khi đếm thông báo chưa đọc: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * HÀM HELPER (ĐỂ PUSH REAL-TIME)
   * Lấy số lượng mới nhất và PUSH cho user
   */
  private async pushNewUnreadCount(userId: number) {
    try {
      // Lấy số lượng 'chưa đọc' mới nhất
      const { count } = await this.getUnreadCount(userId);
      // Gọi Gateway để "đẩy" (push) số này
      this.notificationGateway.sendUnreadCountToUser(userId, count);
    } catch (error) {
      this.logger.error(
        `Lỗi khi push unread count cho user ${userId}: ${error.message}`,
      );
    }
  }

  // HÀM: Gửi thông báo khi có sản phẩm phù hợp được đăng (Matching)
  async notifyMatchingUsers(newProduct: Product, matchingUserIds: number[]) {
    if (!matchingUserIds || matchingUserIds.length === 0) return;

    try {
      const ACTION_NAME = 'matching_product_found';

      let action = await this.actionRepo.findOne({ where: { name: ACTION_NAME } });
      if (!action) {
        this.logger.log(`Action '${ACTION_NAME}' chưa tồn tại, đang tạo mới...`);
        const newAction = this.actionRepo.create({ name: ACTION_NAME });
        action = await this.actionRepo.save(newAction);
      }

      const targetType = await this.targetTypeRepo.findOneByOrFail({ name: 'product' });

      const notifications = matchingUserIds.map((userId) => {
        if (userId === newProduct.user_id) return null;

        const dto: CreateNotificationDto = {
          userId: userId, // Người nhận: Người đang tìm kiếm / đăng sản phẩm trước đó
          actorId: Number(newProduct.user_id), // Người gây ra: Người đăng sản phẩm mới
          actionId: action.id,
          targetTypeId: targetType.id,
          targetId: newProduct.id, 
          productId: newProduct.id,
        };
        return this.create(dto);
      });

      await Promise.all(notifications.filter(n => n !== null));
      this.logger.log(`Đã gửi thông báo "${ACTION_NAME}" tới ${matchingUserIds.length} người dùng.`);
    } catch (error) {
      this.logger.error(`Lỗi gửi thông báo matching_product_found: ${error.message}`);
    }
  }
}
