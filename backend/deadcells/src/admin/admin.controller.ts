import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
  Delete,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminGuard } from 'src/admin/admin.guard'; // đúng đường dẫn

@UseGuards(JwtAuthGuard, AdminGuard)   // ← CHỈ DÙNG 1 LẦN DUY NHẤT Ở ĐÂY
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('pending-cccd')
  async getPendingCCCDUsers() {
    return this.adminService.getPendingUsers();
  }

  @Patch('approve/:id')
  @HttpCode(HttpStatus.OK)
  async approveCCCD(@Param('id') id: string) {
    const userId = Number(id);
    if (isNaN(userId)) throw new BadRequestException('ID không hợp lệ');

    const user = await this.adminService.approveCCCDPending(userId);
    return {
      success: true,
      message: 'Đã phê duyệt thành công',
      user: {
        id: user.id,
        fullName: user.fullName,
        is_cccd_verified: user.is_cccd_verified,
        verifiedAt: user.verifiedAt,
      },
    };
  }

  @Patch('reject/:id')
  @HttpCode(HttpStatus.OK)
  async rejectCCCD(@Param('id') id: string) {
    const userId = Number(id);
    if (isNaN(userId)) throw new BadRequestException('ID không hợp lệ');

    const user = await this.adminService.rejectCCCDPending(userId);
    return {
      success: true,
      message: 'Đã từ chối yêu cầu',
      user: { id: user.id, fullName: user.fullName },
    };
  }

  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search: string = '',
    @Query('status') status: string = 'all',
  ) {
    return this.adminService.getAllUsers(Number(page), Number(limit), search, status);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(Number(id));
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const userId = Number(id);
    if (isNaN(userId)) throw new BadRequestException('ID không hợp lệ');

    await this.adminService.deleteUser(userId);
    return {
      success: true,
      message: 'Đã xóa người dùng và toàn bộ dữ liệu liên quan vĩnh viễn.',
    };
  }

  @Get('groups')
  async getAllGroups() {
    return this.adminService.getAllGroups();
  }

  @Delete('groups/:id')
  async deleteGroup(@Param('id') id: string) {
    const groupId = Number(id);
    if (isNaN(groupId)) throw new BadRequestException('ID không hợp lệ');

    await this.adminService.deleteGroup(groupId);
    return {
      success: true,
      message: 'Đã xóa nhóm và toàn bộ dữ liệu liên quan vĩnh viễn.',
    };
  }
}