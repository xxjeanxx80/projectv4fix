import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { createRmqClient } from '../../common/messaging/rmq-client';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Payment, Booking])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: 'NOTIFICATIONS_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get('RABBITMQ_URL'), 'notifications.queue'),
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
