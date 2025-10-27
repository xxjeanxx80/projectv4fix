import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('staff_shifts')
export class StaffShift {
  @PrimaryGeneratedColumn({ name: 'shift_id' })
  id: number;

  @ManyToOne(() => Staff, (staff) => staff.shifts, { onDelete: 'CASCADE' })
  staff: Staff;

  @Column({ name: 'staff_id' })
  staffId: number;

  @Column({ type: 'timestamp with time zone', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'timestamp with time zone', name: 'end_time' })
  endTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
