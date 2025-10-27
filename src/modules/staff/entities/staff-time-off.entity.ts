import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Staff } from './staff.entity';

@Entity('staff_time_off')
export class StaffTimeOff {
  @PrimaryGeneratedColumn({ name: 'time_off_id' })
  id: number;

  @ManyToOne(() => Staff, (staff) => staff.timeOff, { onDelete: 'CASCADE' })
  staff: Staff;

  @Column({ name: 'staff_id' })
  staffId: number;

  @Column({ type: 'timestamp with time zone', name: 'start_at' })
  startAt: Date;

  @Column({ type: 'timestamp with time zone', name: 'end_at' })
  endAt: Date;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
