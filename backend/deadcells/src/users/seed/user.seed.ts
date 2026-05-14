import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

 async onModuleInit() {
  const userRepo = this.dataSource.getRepository(User);
  const statusRepo = this.dataSource.getRepository('Status');
  const roleRepo = this.dataSource.getRepository('Role');

  // Status
  if (!(await statusRepo.findOne({ where: { id: 1 } }))) {
    await statusRepo.save({ id: 1, name: 'active', description: 'Hoạt động' });
  }

  // Role
  if (!(await roleRepo.findOne({ where: { id: 1 } }))) {
    await roleRepo.save({ id: 1, name: 'admin', description: 'Quản trị hệ thống' });
  }

  if (!(await roleRepo.findOne({ where: { id: 2 } }))) {
    await roleRepo.save({ id: 2, name: 'user', description: 'Người dùng thông thường' });
  }

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // Admin
  if (!(await userRepo.findOne({ where: { email: 'admin@fit.tdc.edu.vn' } }))) {
    await userRepo.save({
      roleId: 1,
      statusId: 1,
      fullName: 'Admin',
      email: 'admin@fit.tdc.edu.vn',
      passwordHash,
      is_verified: true,
    });
    console.log('Seed Admin OK');
  }

  // User test
  if (!(await userRepo.findOne({ where: { email: 'user@fit.tdc.edu.vn' } }))) {
    await userRepo.save({
      roleId: 2,
      statusId: 1,
      fullName: 'User test',
      email: 'user@fit.tdc.edu.vn',
      passwordHash,
      is_verified: true,
    });
    console.log('Seed User test OK');
  }
}
}
