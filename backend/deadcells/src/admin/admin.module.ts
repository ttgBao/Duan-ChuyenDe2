import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Product } from '../entities/product.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, GroupMember, Product]),
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
