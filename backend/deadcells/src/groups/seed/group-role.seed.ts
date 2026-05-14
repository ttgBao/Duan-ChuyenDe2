import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GroupRole } from 'src/entities/group-role.entity';

@Injectable()
export class GroupRoleSeedService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const repo = this.dataSource.getRepository(GroupRole);

    const roles = [
      { id: 1, name: 'Member' }, // Member
      { id: 2, name: 'Leader' }, // Leader
    ];

    for (const role of roles) {
      const exists = await repo.findOne({ where: { id: role.id } });
      if (!exists) {
        await repo.save(role);
      }
    }

    console.log('Seed group roles thành công!.');
  }
}
