import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from 'src/entities/user.entity';
import { Rating } from 'src/entities/rating.entity';

import { UserSeedService } from './seed/user.seed';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rating])],
  controllers: [UsersController],
  providers: [UsersService, UserSeedService],
  exports: [UsersService], 
})
export class UsersModule {}