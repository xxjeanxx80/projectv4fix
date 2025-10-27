import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn({ name: 'feedback_id' })
  id: number;

  @ManyToOne(() => Booking, (booking) => booking.feedbacks, { nullable: false })
  booking: Booking;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @ManyToOne(() => User, { nullable: false })
  customer: User;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
