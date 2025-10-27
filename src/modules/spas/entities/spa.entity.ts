import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SpaService } from '../../services/entities/service.entity';
import { Staff } from '../../staff/entities/staff.entity';

@Entity('spas')
export class Spa {
  @PrimaryGeneratedColumn({ name: 'spa_id' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @ManyToOne(() => User, { eager: true, nullable: false })
  owner: User;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @OneToMany(() => SpaService, (service) => service.spa)
  services?: SpaService[];

  @OneToMany(() => Staff, (staff) => staff.spa)
  staffMembers?: Staff[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
