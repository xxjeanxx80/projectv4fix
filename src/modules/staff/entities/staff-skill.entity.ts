import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('staff_skills')
export class StaffSkill {
  @PrimaryGeneratedColumn({ name: 'skill_id' })
  id: number;

  @ManyToOne(() => Staff, (staff) => staff.skills, { onDelete: 'CASCADE' })
  staff: Staff;

  @Column({ name: 'staff_id' })
  staffId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;
}
