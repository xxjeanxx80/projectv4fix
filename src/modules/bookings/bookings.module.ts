import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Spa } from '../spas/entities/spa.entity';
import { SpaService } from '../services/entities/service.entity';
import { Staff } from '../staff/entities/staff.entity';
import { User } from '../users/entities/user.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Booking, Spa, SpaService, User, Staff, Coupon])],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    {
      provide: 'PAYMENTS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'payments.queue'),
    },
    {
      provide: 'NOTIFICATIONS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'notifications.queue'),
    },
  ],
  exports: [BookingsService],
})
export class BookingsModule {}
