import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryMulter } from 'src/cloudinary/cloudinary.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // ==================== CRUD GROUPS ====================

  /** Tạo nhóm mới (luôn là private) */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(
    @Req() req,
    @Body()
    data: {
      name: string;
      thumbnail_url?: string;
      description?: string;
      invitedUserIds?: number[];
    },
  ) {
    const userId = req.user.id;
    const group = await this.groupService.create(
      {
        name: data.name,
        thumbnail_url: data.thumbnail_url,
        description: data.description,
      },
      userId,
      data.invitedUserIds,
    );

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      isPublic: group.isPublic,
      image: group.thumbnail_url,
      owner: group.owner_id,
      createdAt: group.created_at,
    };
  }

  /** Lấy chi tiết nhóm */
  @Get(':groupId/detail')
  @UseGuards(JwtAuthGuard)
  async getGroupDetail(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.getGroupDetail(groupId, req.user.id);
  }

  /** Sửa thông tin nhóm (chỉ leader) */
  @Patch(':groupId')
  @UseGuards(JwtAuthGuard)
  async updateGroup(
    @Req() req,
    @Param('groupId') groupId: number,
    @Body()
    data: {
      name?: string;
      description?: string;
      thumbnail_url?: string;
      mustApprovePosts?: boolean;
    },
  ) {
    const group = await this.groupService.updateGroup(
      groupId,
      req.user.id,
      data,
    );
    return {
      success: true,
      message: 'Cập nhật thông tin nhóm thành công',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        image: group.thumbnail_url,
        mustApprovePosts: group.mustApprovePosts,
        isPublic: group.isPublic,
      },
    };
  }

  /** Xóa nhóm (chỉ leader) */
  @Delete(':groupId')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(@Req() req, @Param('groupId') groupId: number) {
    await this.groupService.deleteGroup(groupId, req.user.id);
    return { success: true, message: 'Xóa nhóm thành công' };
  }

  // ==================== LIST GROUPS ====================

  /** Lấy tất cả nhóm public */
  @Get('public')
  async getPublicGroups(@Query('userId') userId?: number) {
    return this.groupService.getPublicGroups(userId ? Number(userId) : undefined);
  }

/** Lấy danh sách nhóm PUBLIC user đã tham gia (pending = 3) */
  @Get('my-public-joined')
  async getMyPublicJoinedGroups(@Query('userId') userId: any) {
    // 1. Ép kiểu sang số
    const uid = Number(userId);

    // 2. CHẶN LỖI: Nếu uid không tồn tại hoặc là NaN -> Trả về rỗng luôn
    if (!uid || isNaN(uid)) {
      return [];
    }

    // 3. Nếu ID hợp lệ mới gọi Service
    return this.groupService.getMyPublicJoinedGroups(uid);
  }

  /** Lấy nhóm private đã tham gia */
  @Get()
  @UseGuards(JwtAuthGuard)
  async getGroupsJoin(@Req() req) {
    return this.groupService.getGroupsJoin(req.user.id);
  }

  /** Lấy nhóm mới tham gia (latest) */
  @Get('latest')
  @UseGuards(JwtAuthGuard)
  async getLatestGroups(@Req() req) {
    return this.groupService.getLatestGroups(req.user.id);
  }

  // ==================== MEMBER MANAGEMENT ====================

  /** Lấy danh sách thành viên (pending = 3) */
  @Get(':groupId/members')
  @UseGuards(JwtAuthGuard)
  async getMembers(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.getMembers(groupId, req.user.id);
  }

  /** Lấy danh sách nhóm private mà user chưa tham gia */
  @Get('suggestions')
  @UseGuards(JwtAuthGuard)
  async getSuggestedGroups(@Req() req) {
    const userId = req.user.id;
    return this.groupService.getGroupsUserNotJoined(userId);
  }

  //join qr
  @Post(':groupId/join-by-qr')
  @UseGuards(JwtAuthGuard)
  async joinByQR(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.joinByQR(groupId, req.user.id);
  }

  /** Lấy danh sách yêu cầu tham gia chờ duyệt (pending = 2) */
  @Get(':groupId/pending-members')
  @UseGuards(JwtAuthGuard)
  async getPendingMembers(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.getPendingMembers(groupId, req.user.id);
  }

  /** Duyệt thành viên (pending: 2 → 3) */
  @Post(':groupId/members/:targetUserId/approve')
  @UseGuards(JwtAuthGuard)
  async approveMember(
    @Req() req,
    @Param('groupId') groupId: number,
    @Param('targetUserId') targetUserId: number,
    @Body('approve') approve: boolean,
  ) {
    return this.groupService.approveMember(
      groupId,
      targetUserId,
      approve,
      req.user.id,
    );
  }

  /** Xóa thành viên khỏi nhóm */
  @Delete(':groupId/members/:userId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Req() req,
    @Param('groupId') groupId: number,
    @Param('userId') targetUserId: number,
  ) {
    await this.groupService.removeMember(groupId, targetUserId, req.user.id);
    return { success: true, message: 'Đã xóa thành viên khỏi nhóm' };
  }

  /** Chuyển quyền trưởng nhóm */
  @Post(':groupId/transfer-leadership')
  @UseGuards(JwtAuthGuard)
  async transferLeadership(
    @Req() req,
    @Param('groupId') groupId: number,
    @Body('newLeaderId') newLeaderId: number,
  ) {
    await this.groupService.transferLeadership(
      groupId,
      newLeaderId,
      req.user.id,
    );
    return { success: true, message: 'Đã chuyển quyền trưởng nhóm thành công' };
  }

  // ==================== INVITATION MANAGEMENT ====================

  /** Mời thành viên vào nhóm */
  @Post(':groupId/invite')
  @UseGuards(JwtAuthGuard)
  async inviteUsers(
    @Req() req,
    @Param('groupId') groupId: number,
    @Body() data: { inviteeIds: number[] },
  ) {
    return this.groupService.inviteUsers(groupId, req.user.id, data.inviteeIds);
  }

  /** Lấy danh sách user để mời */
  @Get(':groupId/users-to-invite')
  @UseGuards(JwtAuthGuard)
  async getUsersToInvite(
    @Req() req,
    @Param('groupId') groupId: number,
    @Query('search') search?: string,
  ) {
    return this.groupService.getUsersToInvite(groupId, search);
  }

  /** Lấy danh sách lời mời đang chờ */
  @Get('invitations/pending')
  @UseGuards(JwtAuthGuard)
  async getMyPendingInvitations(@Req() req) {
    return this.groupService.getMyPendingInvitations(req.user.id);
  }

  /** Chấp nhận lời mời vào nhóm */
  @Post('invitations/:invitationId/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @Req() req,
    @Param('invitationId') invitationId: number,
  ) {
    return this.groupService.acceptInvitation(invitationId, req.user.id);
  }

  /** Từ chối lời mời vào nhóm */
  @Post('invitations/:invitationId/reject')
  @UseGuards(JwtAuthGuard)
  async rejectInvitation(
    @Req() req,
    @Param('invitationId') invitationId: number,
  ) {
    return this.groupService.rejectInvitation(invitationId, req.user.id);
  }

  @Patch(':groupId/post-approval')
  @UseGuards(JwtAuthGuard)
  async updatePostApproval(
    @Req() req,
    @Param('groupId') groupId: number,
    @Body('mustApprovePosts') mustApprovePosts: boolean,
  ) {
    return this.groupService.updatePostApprovalSetting(
      groupId,
      req.user.id,
      mustApprovePosts,
    );
  }

  // ==================== JOIN / LEAVE GROUP ====================

  /** User tham gia nhóm (Public: joined ngay, Private: chờ duyệt) */
  @Post(':groupId/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.joinGroup(groupId, req.user.id);
  }

  /** ✅ Hủy yêu cầu tham gia (xóa pending = 2) */
  @Delete(':groupId/cancel-request')
  @UseGuards(JwtAuthGuard)
  async cancelJoinRequest(@Req() req, @Param('groupId') groupId: number) {
    await this.groupService.cancelJoinRequest(groupId, req.user.id);
    return { success: true, message: 'Đã hủy yêu cầu tham gia' };
  }

  /** User rời nhóm (xóa pending = 3) */
  @Delete(':groupId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@Req() req, @Param('groupId') groupId: number) {
    await this.groupService.leaveGroup(groupId, req.user.id);
    return { success: true, message: 'Rời nhóm thành công' };
  }

  // ==================== POST MANAGEMENT ====================

  /** Lấy sản phẩm / bài viết của nhóm */
  @Get(':groupId/products')
  @UseGuards(JwtAuthGuard)
  async getGroupProducts(@Param('groupId') groupId: number, @Req() req) {
    return this.groupService.getGroupProducts(groupId, req.user.id);
  }

  /** Lấy tất cả bài viết từ các nhóm user tham gia */
  @Get('my/group-posts')
  @UseGuards(JwtAuthGuard)
  async getMyGroupPosts(@Req() req) {
    return this.groupService.findPostsFromUserGroups(req.user.id);
  }

  /** Lấy danh sách bài viết chờ duyệt */
  @Get(':groupId/pending-posts')
  @UseGuards(JwtAuthGuard)
  async getPendingPosts(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.getPendingPosts(groupId, req.user.id);
  }

  /** Duyệt / từ chối bài viết */
  @Post('posts/:postId/approve')
  @UseGuards(JwtAuthGuard)
  async approvePost(
    @Req() req,
    @Param('postId') postId: number,
    @Body('approve') approve: boolean,
  ) {
    return this.groupService.approvePost(postId, approve, req.user.id);
  }

  /** Thống kê bài viết của user trong nhóm */
  @Get(':groupId/my-posts')
  @UseGuards(JwtAuthGuard)
  async getMyPostsInGroup(@Req() req, @Param('groupId') groupId: number) {
    return this.groupService.getMyPostsInGroup(groupId, req.user.id);
  }

  // ==================== UTILITY ENDPOINTS ====================

  /** Lấy role của user trong nhóm */
  @Get(':groupId/role')
  @UseGuards(JwtAuthGuard)
  async getUserRole(@Req() req, @Param('groupId') groupId: number) {
    const role = await this.groupService.getUserRole(groupId, req.user.id);
    return { role };
  }

  /** Lấy trạng thái tham gia nhóm */
  @Get(':groupId/join-status')
  @UseGuards(JwtAuthGuard)
  async getJoinStatus(@Req() req, @Param('groupId') groupId: number) {
    const status = await this.groupService.getJoinStatus(groupId, req.user.id);
    return { status };
  }

  /** Kiểm tra user có phải thành viên không */
  @Get(':groupId/is-member')
  @UseGuards(JwtAuthGuard)
  async checkMember(@Req() req, @Param('groupId') groupId: number) {
    const isMember = await this.groupService.isMember(groupId, req.user.id);
    return { groupId, userId: req.user.id, isMember };
  }

  // ==================== UPLOAD ====================

  /** Upload ảnh nhóm */
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', CloudinaryMulter))
  async uploadGroupImage(@UploadedFile() file: Express.Multer.File) {
    return { url: file?.path };
  }
}
