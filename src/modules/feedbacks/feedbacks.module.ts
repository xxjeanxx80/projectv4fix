import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingsModule } from '../bookings/bookings.module';
import { User } from '../users/entities/user.entity';
import { FeedbacksController } from './feedbacks.controller';
import { FeedbacksService } from './feedbacks.service';
import { Feedback } from './entities/feedback.entity';

@Module({
  imports: [ConfigModule, BookingsModule, TypeOrmModule.forFeature([Feedback, Booking, User])],
  controllers: [FeedbacksController],
  providers: [
    FeedbacksService,
    {
      provide: 'FEEDBACKS_EVENTS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'feedbacks.queue'),
    },
  ],
  exports: [FeedbacksService],
})
export class FeedbacksModule {}
