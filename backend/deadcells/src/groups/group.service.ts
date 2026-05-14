import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from 'src/entities/group-member.entity';
import { Product } from 'src/entities/product.entity';
import { Repository, In } from 'typeorm';
import { ProductStatus } from 'src/entities/product-status.entity';
import { FavoritesService } from 'src/favorites/favorites.service';
import { GroupInvitation } from 'src/entities/group-invitation.entity';
import { User } from 'src/entities/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class GroupService {
  logger: Console;
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductStatus)
    private readonly productStatusRepo: Repository<ProductStatus>,
    @InjectRepository(GroupInvitation)
    private readonly invitationRepo: Repository<GroupInvitation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
    private readonly favoritesService: FavoritesService,
    private readonly chatService: ChatService, // ⭐ Inject ở đây
  ) {}

  // ==================== UTILITY FUNCTIONS ====================

  private statusGroupMember(pending?: number): 'none' | 'pending' | 'joined' {
    if (pending === 1) return 'none';
    if (pending === 2) return 'pending';
    if (pending === 3) return 'joined';
    return 'none';
  }

  async findOneById(groupId: number) {
    return this.groupRepo.findOne({
      where: { id: groupId },
    });
  }

  async countMembers(groupId: number): Promise<number> {
    return this.groupMemberRepo.count({
      where: { group_id: groupId, pending: 3 },
    });
  }

  async countProductsByGroup(groupId: number): Promise<number> {
    return this.productRepo.count({
      where: {
        visibility_type: 1,
        group_id: groupId,
        product_status_id: 2,
      },
    });
  }

  async getUserRole(
    groupId: number,
    userId: number,
  ): Promise<'leader' | 'member' | 'none'> {
    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId, pending: 3 },
    });
    if (!member) return 'none';
    return Number(member.group_role_id) === 2 ? 'leader' : 'member';
  }

  async isMember(groupId: number, userId: number): Promise<boolean> {
    const count = await this.groupMemberRepo.count({
      where: { group_id: groupId, user_id: userId, pending: 3 },
    });
    return count > 0;
  }

  async getJoinStatus(
    groupId: number,
    userId: number,
  ): Promise<'none' | 'pending' | 'joined'> {
    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId },
    });
    if (!member) return 'none';
    return this.statusGroupMember(member.pending);
  }

  async updatePostApprovalSetting(
    groupId: number,
    userId: number,
    mustApprovePosts: boolean,
  ) {
    // 1. Lấy nhóm
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Nhóm không tồn tại');
    }

    // 2. Kiểm tra role bằng hàm bạn đưa
    const role = await this.getUserRole(groupId, userId);

    if (role === 'none') {
      throw new ForbiddenException('Bạn không phải thành viên nhóm');
    }

    // 3. Chỉ leader được phép chỉnh
    if (role !== 'leader') {
      throw new ForbiddenException(
        'Chỉ trưởng nhóm mới có quyền thay đổi cài đặt duyệt bài',
      );
    }

    // 4. Cập nhật
    group.mustApprovePosts = mustApprovePosts;
    await this.groupRepo.save(group);

    // 5. Trả về JSON
    return {
      message: 'Cập nhật cài đặt duyệt bài thành công',
      groupId,
      mustApprovePosts,
    };
  }

  // ==================== CRUD GROUPS ====================

  async create(
    data: Partial<Group>,
    userId: number,
    invitedUserIds?: number[],
  ): Promise<Group> {
    const group = this.groupRepo.create({
      name: data.name,
      description: data.description,
      isPublic: false,
      mustApprovePosts: false,
      thumbnail_url: data.thumbnail_url || undefined,
      owner_id: userId,
      status_id: 1,
    });
    const savedGroup = await this.groupRepo.save(group);

    // Leader tự động vào nhóm
    const leaderMember = this.groupMemberRepo.create({
      group_id: savedGroup.id,
      user_id: userId,
      group_role_id: 2,
      pending: 3,
    });
    await this.groupMemberRepo.save(leaderMember);

    // Mời thành viên nếu có
    if (invitedUserIds && invitedUserIds.length > 0) {
      for (const inviteeId of invitedUserIds) {
        const invitation = this.invitationRepo.create({
          group_id: savedGroup.id,
          inviter_id: userId,
          invitee_id: inviteeId,
          status: 1,
        });
        const savedInvitation = await this.invitationRepo.save(invitation);

        await this.notificationService?.notifyGroupInvitation?.(
          inviteeId,
          userId,
          savedGroup.id,
          savedInvitation.id,
        );
      }
    }

    return savedGroup;
  }

  async getGroupDetail(groupId: number, userId: number) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    const isMember = await this.isMember(groupId, userId);
    const role = await this.getUserRole(groupId, userId);
    const memberCount = await this.countMembers(groupId);
    const postCount = await this.countProductsByGroup(groupId);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      image: group.thumbnail_url,
      isPublic: group.isPublic,
      mustApprovePosts: group.mustApprovePosts,
      memberCount,
      postCount,
      owner: {
        id: group.owner_id,
        name: group.owner?.nickname,
        avatar: group.owner?.image,
      },
      userRole: role,
      isMember,
    };
  }

  async updateGroup(
    groupId: number,
    userId: number,
    data: {
      name?: string;
      description?: string;
      thumbnail_url?: string;
      mustApprovePosts?: boolean;
    },
  ): Promise<Group> {
    const role = await this.getUserRole(groupId, userId);
    if (role !== 'leader') {
      throw new ForbiddenException(
        'Chỉ trưởng nhóm mới có quyền sửa thông tin',
      );
    }

    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    if (data.name !== undefined) group.name = data.name;
    if (data.description !== undefined) group.description = data.description;
    if (data.thumbnail_url !== undefined)
      group.thumbnail_url = data.thumbnail_url;
    if (data.mustApprovePosts !== undefined)
      group.mustApprovePosts = data.mustApprovePosts;

    return this.groupRepo.save(group);
  }

  async deleteGroup(groupId: number, userId: number): Promise<void> {
    const role = await this.getUserRole(groupId, userId);
    if (role !== 'leader') {
      throw new ForbiddenException('Bạn không có quyền xóa nhóm này');
    }

    await this.groupMemberRepo.delete({ group_id: groupId });
    await this.productRepo.delete({ group_id: groupId });
    await this.invitationRepo.delete({ group_id: groupId });

    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    await this.groupRepo.remove(group);
  }

  // ==================== LIST GROUPS ====================

  async getPublicGroups(): Promise<any[]> {
    const groups = await this.groupRepo.find({
      where: { isPublic: true },
      relations: ['owner'],
      order: { created_at: 'DESC' },
    });

    return Promise.all(
      groups.map(async (g) => {
        const memberCount = await this.countMembers(g.id);
        return {
          id: g.id,
          name: g.name,
          description: g.description,
          image: g.thumbnail_url,
          mustApprovePosts: g.mustApprovePosts,
          memberCount,
          isPublic: true,
        };
      }),
    );
  }

  //Lấy nhóm dành cho bạn
  async getGroupsJoin(userId: number): Promise<any[]> {
    const groups = await this.groupMemberRepo.find({
      where: { user_id: userId, pending: 3 },
      relations: ['group', 'group.owner'],
    });

    return Promise.all(
      groups.map(async (m) => {
        const g = m.group;
        const memberCount = await this.countMembers(g.id);
        const postCount = await this.countProductsByGroup(g.id);
        return {
          id: g.id,
          name: g.name,
          image: g.thumbnail_url,
          description: g.description,
          memberCount,
          ownerId: g.owner?.id,
          posts: postCount,
          mustApprovePosts: g.mustApprovePosts,
          isPublic: g.isPublic,
        };
      }),
    );
  }

  async getLatestGroups(userId: number, limit = 5) {
    const memberships = await this.groupMemberRepo.find({
      where: { user_id: userId, pending: 3 },
      relations: ['group'],
    });

    const joinedGroups = memberships
      .map((m) => m.group)
      .filter((g) => g)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);

    return Promise.all(
      joinedGroups.map(async (g) => {
        const postCount = await this.countProductsByGroup(g.id);
        const memberCount = await this.countMembers(g.id);
        return {
          id: g.id,
          name: g.name,
          members: `${memberCount} thành viên`,
          posts: `${postCount} bài viết`,
          image: g.thumbnail_url || null,
          isPublic: g.isPublic,
        };
      }),
    );
  }

  // ==================== MEMBER MANAGEMENT ====================

  async getMembers(groupId: number, userId: number) {
    const isMember = await this.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên để xem danh sách');
    }

    const members = await this.groupMemberRepo.find({
      where: { group_id: groupId, pending: 3 },
      relations: ['user', 'role'],
      order: { created_at: 'ASC' },
    });

    return members.map((m) => ({
      id: m.user_id,
      name: m.user.nickname,
      email: m.user.email,
      avatar: m.user.image,
      role: Number(m.group_role_id) === 2 ? 'leader' : 'member',
      roleName: Number(m.group_role_id) === 2 ? 'Trưởng nhóm' : 'Thành viên',
      joinedAt: m.created_at,
    }));
  }

  async getPendingMembers(groupId: number, userId: number) {
    const role = await this.getUserRole(groupId, userId);
    if (role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới được xem yêu cầu');
    }

    const pending = await this.groupMemberRepo.find({
      where: { group_id: groupId, pending: 2 },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });

    return pending.map((p) => ({
      user_id: p.user_id,
      name: p.user.nickname,
      email: p.user.email,
      avatar: p.user.image,
      requested_at: p.created_at,
    }));
  }

  async approveMember(
    groupId: number,
    targetUserId: number,
    approve: boolean,
    leaderId: number,
  ) {
    const role = await this.getUserRole(groupId, leaderId);
    if (role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới được duyệt');
    }

    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: targetUserId, pending: 2 },
    });

    if (!member) throw new NotFoundException('Không tìm thấy yêu cầu');

    if (approve) {
      member.pending = 3;
      await this.groupMemberRepo.save(member);
      return { success: true, message: 'Đã duyệt thành viên' };
    } else {
      await this.groupMemberRepo.remove(member);
      return { success: true, message: 'Đã từ chối yêu cầu tham gia' };
    }
  }

  async removeMember(
    groupId: number,
    targetUserId: number,
    userId: number,
  ): Promise<void> {
    const role = await this.getUserRole(groupId, userId);
    if (role !== 'leader') {
      throw new ForbiddenException(
        'Chỉ trưởng nhóm mới có quyền xóa thành viên',
      );
    }

    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: targetUserId },
    });

    if (!member) throw new NotFoundException('Người này không phải thành viên');
    if (member.group_role_id === 2) {
      throw new BadRequestException('Không thể xóa trưởng nhóm');
    }

    await this.groupMemberRepo.delete({
      group_id: groupId,
      user_id: targetUserId,
    });
  }

  async transferLeadership(
    groupId: number,
    newLeaderId: number,
    currentUserId: number,
  ): Promise<void> {
    const role = await this.getUserRole(groupId, currentUserId);
    if (role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới có quyền chuyển quyền');
    }

    const newLeaderMember = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: newLeaderId, pending: 3 },
    });

    if (!newLeaderMember) {
      throw new NotFoundException('Người được chọn không phải thành viên');
    }

    await this.groupMemberRepo.update(
      { group_id: groupId, user_id: currentUserId },
      { group_role_id: 1 },
    );

    await this.groupMemberRepo.update(
      { group_id: groupId, user_id: newLeaderId },
      { group_role_id: 2 },
    );

    await this.groupRepo.update({ id: groupId }, { owner_id: newLeaderId });
  }

  // ==================== INVITATION MANAGEMENT ====================

  async inviteUsers(
    groupId: number,
    inviterId: number,
    inviteeIds: number[],
  ): Promise<{ success: boolean; message: string; invited: number[] }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    const invited: number[] = [];

    for (const inviteeId of inviteeIds) {
      const existingMember = await this.groupMemberRepo.findOne({
        where: { group_id: groupId, user_id: inviteeId },
      });
      if (existingMember) continue;

      const existingInvitation = await this.invitationRepo.findOne({
        where: { group_id: groupId, invitee_id: inviteeId, status: 1 },
      });
      if (existingInvitation) continue;

      const invitation = this.invitationRepo.create({
        group_id: groupId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        status: 1,
      });
      const savedInvitation = await this.invitationRepo.save(invitation);
      invited.push(inviteeId);

      await this.notificationService?.notifyGroupInvitation?.(
        inviteeId,
        inviterId,
        groupId,
        savedInvitation.id,
      );
    }

    return {
      success: true,
      message: `Đã gửi lời mời đến ${invited.length} người`,
      invited,
    };
  }

  async getMyPendingInvitations(userId: number) {
    const invitations = await this.invitationRepo.find({
      where: { invitee_id: userId, status: 1 },
      relations: ['group', 'inviter'],
      order: { created_at: 'DESC' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      group: {
        id: inv.group.id,
        name: inv.group.name,
        image: inv.group.thumbnail_url,
        description: inv.group.description,
      },
      inviter: {
        id: inv.inviter.id,
        name: inv.inviter.nickname,
        avatar: inv.inviter.image,
      },
      created_at: inv.created_at,
    }));
  }

  async acceptInvitation(invitationId: number, userId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['group'],
    });

    if (!invitation) throw new NotFoundException('Không tìm thấy lời mời');
    if (invitation.invitee_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền chấp nhận lời mời này');
    }
    if (invitation.status !== 1) {
      throw new BadRequestException('Lời mời này đã được xử lý');
    }

    const existingMember = await this.groupMemberRepo.findOne({
      where: { group_id: invitation.group_id, user_id: userId },
    });

    if (!existingMember) {
      const member = this.groupMemberRepo.create({
        group_id: invitation.group_id,
        user_id: userId,
        group_role_id: 1,
        pending: 3,
      });
      await this.groupMemberRepo.save(member);
    }

    await this.invitationRepo.delete({ id: invitationId });

    return {
      success: true,
      message: 'Đã tham gia nhóm thành công',
      groupId: invitation.group_id,
      groupName: invitation.group?.name || null,
    };
  }

  async rejectInvitation(invitationId: number, userId: number) {
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId },
      relations: ['group'],
    });

    if (!invitation) throw new NotFoundException('Không tìm thấy lời mời');
    if (invitation.invitee_id !== userId) {
      throw new ForbiddenException('Bạn không có quyền từ chối lời mời này');
    }
    if (invitation.status !== 1) {
      throw new BadRequestException('Lời mời này đã được xử lý');
    }

    // XÓA LUÔN invitation khỏi DB
    await this.invitationRepo.delete({ id: invitationId });

    return {
      success: true,
      message: `Bạn đã từ chối lời mời vào nhóm ${invitation.group?.name || ''}`,
    };
  }

  async getUsersToInvite(groupId: number, search?: string) {
    const members = await this.groupMemberRepo.find({
      where: { group_id: groupId },
      select: ['user_id'],
    });
    const memberIds = members.map((m) => m.user_id);

    const pendingInvitations = await this.invitationRepo.find({
      where: { group_id: groupId, status: 1 },
      select: ['invitee_id'],
    });
    const invitedIds = pendingInvitations.map((i) => i.invitee_id);

    const excludeIds = [...new Set([...memberIds, ...invitedIds])];

    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .where('user.role_id = :roleId', { roleId: 2 })
      .andWhere('user.id NOT IN (:...excludeIds)', {
        excludeIds: excludeIds.length ? excludeIds : [0],
      });

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(user.nickname ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const users = await queryBuilder
      .select(['user.id', 'user.nickname', 'user.email', 'user.image'])
      .limit(50)
      .getMany();

    return users.map((u) => ({
      id: u.id,
      name: u.nickname,
      email: u.email,
      avatar: u.image,
    }));
  }

  // ==================== JOIN / LEAVE GROUP ====================

  async joinGroup(groupId: number, userId: number): Promise<any> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

   

    const existing = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (existing) {
      if (existing.pending === 2) {
        throw new BadRequestException('Bạn đã gửi yêu cầu tham gia rồi');
      }
      if (existing.pending === 3) {
        throw new BadRequestException('Bạn đã là thành viên');
      }
    }

    const pendingStatus = group.isPublic ? 3 : 2;

    const member = this.groupMemberRepo.create({
      group_id: groupId,
      user_id: userId,
      group_role_id: 1,
      pending: pendingStatus,
    });
    await this.groupMemberRepo.save(member);
    await this.chatService.createRoomGroup(groupId);
    return {
      success: true,
      message: group.isPublic
        ? 'Bạn đã tham gia nhóm thành công'
        : 'Yêu cầu tham gia đã được gửi, chờ trưởng nhóm duyệt',
      joinStatus: group.isPublic ? 'joined' : 'pending',
    };
  }

  async cancelJoinRequest(groupId: number, userId: number) {
    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId, pending: 2 },
    });
    if (!member) throw new NotFoundException('Không có yêu cầu nào để hủy');
    await this.groupMemberRepo.remove(member);
  }

  async leaveGroup(groupId: number, userId: number): Promise<void> {
    const member = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!member) throw new BadRequestException('Bạn không phải là thành viên');
    if (member.pending !== 3) {
      throw new BadRequestException('Bạn chưa là thành viên chính thức');
    }
    if (member.group_role_id === 2) {
      throw new BadRequestException(
        'Leader không thể rời nhóm. Hãy chuyển quyền leader trước.',
      );
    }

    await this.groupMemberRepo.delete({ group_id: groupId, user_id: userId });
  }

  // ==================== POST MANAGEMENT ====================

  async getGroupProducts(groupId: number, userId: number) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    const isMember = await this.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên của nhóm để xem bài viết');
    }

    const products = await this.productRepo.find({
      where: { group_id: groupId, productStatus: { id: 2 } },
      relations: [
        'images',
        'user',
        'category',
        'subCategory',
        'group',
        'postType',
        'productStatus',
      ],
      order: { created_at: 'DESC' },
      take: 20,
    });

    return Promise.all(products.map((p) => this.formatPost(p, userId)));
  }

  async findPostsFromUserGroups(userId: number) {
    const memberships = await this.groupMemberRepo.find({
      where: { user_id: userId, pending: 3 },
      select: ['group_id'],
    });

    const groupIds = memberships.map((m) => m.group_id);
    if (!groupIds.length) return [];

    const products = await this.productRepo.find({
      where: {
        group_id: In(groupIds),
        productStatus: { id: 2 },
      },
      relations: [
        'images',
        'user',
        'category',
        'subCategory',
        'group',
        'postType',
        'productStatus',
      ],
      order: { created_at: 'DESC' },
    });

    return Promise.all(products.map((p) => this.formatPost(p, userId)));
  }

  async getPendingPosts(groupId: number, userId: number) {
    const role = await this.getUserRole(groupId, userId);
    if (role !== 'leader') {
      throw new ForbiddenException(
        'Chỉ trưởng nhóm mới được xem bài chờ duyệt',
      );
    }

    const posts = await this.productRepo.find({
      where: { group_id: groupId, productStatus: { id: 1 } },
      relations: ['user', 'images', 'postType', 'productStatus'],
      order: { created_at: 'DESC' },
    });

    return Promise.all(posts.map((p) => this.formatPost(p, userId)));
  }

  async approvePost(postId: number, approve: boolean, userId: number) {
    const post = await this.productRepo.findOne({
      where: { id: postId },
      relations: ['group'],
    });
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    if (!post.group_id) {
      throw new BadRequestException('Bài viết này không thuộc nhóm nào (Không thể duyệt qua GroupService).');
    }
    
    const role = await this.getUserRole(post.group_id, userId);
    if (role !== 'leader') {
      throw new ForbiddenException('Chỉ trưởng nhóm mới được duyệt bài viết');
    }

    if (approve) {
      const status = await this.productStatusRepo.findOne({ where: { id: 2 } });
      post.productStatus = status;
      await this.productRepo.save(post);
      return { success: true, message: 'Đã duyệt bài viết' };
    } else {
      await this.productRepo.delete(postId);
      return { success: true, message: 'Đã từ chối và xóa bài viết' };
    }
  }

  async getMyPostsInGroup(groupId: number, userId: number) {
    const isMember = await this.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('Bạn phải là thành viên để xem nội dung');
    }

    const posts = await this.productRepo.find({
      where: { group_id: groupId, user_id: userId },
      relations: ['images', 'postType', 'productStatus'],
      order: { created_at: 'DESC' },
    });

    return {
      total: posts.length,
      approved: posts.filter((p) => p.productStatus?.id === 2).length,
      pending: posts.filter((p) => p.productStatus?.id === 1).length,
      posts: await Promise.all(posts.map((p) => this.formatPost(p, userId))),
    };
  }

  async joinByQR(groupId: number, userId: number) {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Nhóm không tồn tại');

    const existing = await this.groupMemberRepo.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (existing?.pending === 3) {
      return {
        success: true,
        message: 'Bạn đã là thành viên',
        alreadyJoined: true,
      };
    }

    if (existing?.pending === 2) {
      existing.pending = 3;
      await this.groupMemberRepo.save(existing);

      return {
        success: true,
        message: 'Tham gia nhóm thành công!',
        alreadyJoined: false,
      };
    }

    const member = this.groupMemberRepo.create({
      group_id: groupId,
      user_id: userId,
      group_role_id: 1,
      pending: 3,
    });
    await this.groupMemberRepo.save(member);

    return {
      success: true,
      message: group.isPublic
        ? 'Tham gia nhóm thành công!'
        : 'Yêu cầu tham gia đã được gửi',
    };
  }

  async getGroupsUserNotJoined(userId: number) {
    // 1. Lấy tất cả nhóm private
    const privateGroups = await this.groupRepo.find({
      where: { isPublic: false },
      relations: ['owner', 'members'],
      order: { created_at: 'DESC' },
    });

    // 2. Lấy danh sách group_id mà user đã tham gia (pending = 3)
    const joined = await this.groupMemberRepo.find({
      where: { user_id: userId, pending: 3 },
      select: ['group_id'],
    });

    const joinedSet = new Set(joined.map((j) => j.group_id));

    // 3. Lọc ra các nhóm mà user chưa tham gia (có thể chưa từng gửi yêu cầu hoặc đang pending)
    const notJoinedGroups = privateGroups.filter((g) => !joinedSet.has(g.id));

    // 4. Lấy trạng thái tham gia (nếu có) cho các nhóm còn lại
    const allMemberships = await this.groupMemberRepo.find({
      where: {
        user_id: userId,
        group_id: In(notJoinedGroups.map((g) => g.id)),
      },
      select: ['group_id', 'pending'],
    });

    const pendingMap = new Map<number, number>();
    allMemberships.forEach((m) => pendingMap.set(m.group_id, m.pending));

    // 5. Trả về thông tin nhóm kèm joinStatus
    return Promise.all(
      notJoinedGroups.map(async (g) => {
        const memberCount = await this.countMembers(g.id);
        const postCount = await this.countProductsByGroup(g.id);
        const pending = pendingMap.get(g.id); // có thể undefined

        return {
          id: g.id,
          name: g.name,
          image: g.thumbnail_url || null,
          description: g.description || '',
          memberCount,
          posts: postCount,
          mustApprovePosts: g.mustApprovePosts,
          isPublic: g.isPublic,
          joinStatus: this.statusGroupMember(pending), // 'none' | 'pending'
        };
      }),
    );
  }

  // ==================== FORMAT HELPER ====================

  private async formatPost(p: Product, userId: number) {
    const { count } = await this.favoritesService.countFavorites(p.id);
    const { isFavorite } = await this.favoritesService.isFavorite(userId, p.id);

    const categoryName = p.category?.name || null;
    const subCategoryName = p.subCategory?.name || null;
    const tag =
      categoryName && subCategoryName
        ? `${categoryName} - ${subCategoryName}`
        : categoryName || subCategoryName || 'Không có danh mục';

    const address =
      typeof p.address_json === 'string'
        ? JSON.parse(p.address_json)
        : p.address_json || {};

    const location =
      address.full ||
      [address.ward, address.district, address.province]
        .filter(Boolean)
        .join(', ') ||
      'Không rõ địa chỉ';

    const images = Array.isArray(p.images)
      ? p.images
          .filter((img) => img && (img.id != null || img.image_url))
          .map((img) => ({
            id: img.id,
            product_id: img.product_id,
            name: img.name,
            image_url: img.image_url,
            created_at: img.created_at,
          }))
      : [];

    const thumbnail_url = p.thumbnail_url || images?.[0]?.image_url || null;

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      thumbnail_url,
      phone: p.user?.phone || null,
      user_id: p.user?.id,
      user: p.user
        ? {
            id: p.user.id,
            name: p.user.nickname,
            email: p.user.email,
            avatar: p.user.image,
            phone: p.user.phone,
          }
        : null,
      postType: p.postType
        ? { id: p.postType.id, name: p.postType.name }
        : null,
      productStatus: p.productStatus
        ? { id: p.productStatus.id, name: p.productStatus.name }
        : null,
      group: p.group
        ? {
            id: p.group_id,
            name: p.group.name,
            image: p.group.thumbnail_url,
          }
        : null,
      images,
      imageCount: images.length,
      location,
      tag,
      isFavorite,
      favoriteCount: count,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  }

  // Thay thế hàm cũ bằng hàm này
  async getMyPublicJoinedGroups(userId: number) {
    // 1. Dùng hàm find của TypeORM để lấy dữ liệu an toàn nhất
    const members = await this.groupMemberRepo.find({
      where: {
        user_id: userId,
        pending: 3, // Đã tham gia
      },
      relations: ['group'], // Load thông tin nhóm đi kèm
    });

    // 2. Lọc danh sách bằng Javascript (Tránh lỗi SQL query với Boolean)
    const result = members
      .map((m) => m.group) // Lấy ra object Group
      .filter((g) => g && g.isPublic === true) // Chỉ lấy nhóm Public
      .map((g) => ({
        id: g.id,
        name: g.name,
        isPublic: true,
      }));

    // Log ra terminal server để bạn yên tâm
    console.log(
      `✅ [API Group] User ${userId} - Tìm thấy ${result.length} nhóm Public`,
    );

    return result;
  }
}
