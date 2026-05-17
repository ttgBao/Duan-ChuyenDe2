import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationRoom } from './conversation-room.entity';
import { User } from './user.entity';

@Entity({ name: 'conversation_participants' })
export class ConversationParticipant {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  conversation_id: number;

  @ManyToOne(() => ConversationRoom, (c) => c.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: ConversationRoom;

  @Column({ type: 'bigint' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', default: 'MEMBER' })
  role: string;

  @Column({ type: 'timestamptz', nullable: true })
  last_read_at: Date | null;

  @Column({ type: 'text', default: 'ACTIVE' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  cleared_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
