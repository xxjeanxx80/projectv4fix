import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback) private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject('FEEDBACKS_EVENTS') private readonly feedbackEventsClient: RmqClient,
  ) {}

  async create(dto: CreateFeedbackDto) {
    const booking = await this.bookingRepository.findOne({ where: { id: dto.bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    const customer = await this.userRepository.findOne({ where: { id: dto.customerId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const feedback = this.feedbackRepository.create({
      booking,
      bookingId: booking.id,
      customer,
      customerId: customer.id,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    await this.feedbackRepository.save(feedback);
    this.feedbackEventsClient.emit('feedback.created', { feedbackId: feedback.id, bookingId: booking.id });

    return new ApiResponseDto({ success: true, message: 'Feedback recorded.', data: feedback });
  }

  async findAll() {
    const feedback = await this.feedbackRepository.find();
    return new ApiResponseDto({ success: true, message: 'Feedback retrieved.', data: feedback });
  }

  async findForBooking(bookingId: number) {
    const feedback = await this.feedbackRepository.find({ where: { bookingId } });
    return new ApiResponseDto({ success: true, message: 'Feedback retrieved for booking.', data: feedback });
  }
}
