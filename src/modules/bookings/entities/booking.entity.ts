import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Spa } from '../../spas/entities/spa.entity';
import { SpaService } from '../../services/entities/service.entity';
import { Staff } from '../../staff/entities/staff.entity';
import { User } from '../../users/entities/user.entity';
import { Feedback } from '../../feedbacks/entities/feedback.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn({ name: 'booking_id' })
  id: number;

  @ManyToOne(() => Spa, { eager: true, nullable: false })
  spa: Spa;

  @Column({ name: 'spa_id' })
  spaId: number;

  @ManyToOne(() => SpaService, { eager: true, nullable: false })
  service: SpaService;

  @Column({ name: 'service_id' })
  serviceId: number;

  @ManyToOne(() => User, { eager: true, nullable: false })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Staff, (staff) => staff.bookings, { eager: true, nullable: true })
  staff?: Staff | null;

  @Column({ name: 'staff_id', nullable: true })
  staffId?: number | null;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_at' })
  scheduledAt: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ name: 'coupon_code', type: 'varchar', length: 255, nullable: true })
  couponCode: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'final_price' })
  finalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'commission_amount' })
  commissionAmount: number;

  @OneToMany(() => Feedback, (feedback) => feedback.booking)
  feedbacks?: Feedback[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
