import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: 'NOTIFICATIONS_PUBLISHER',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'notifications.queue'),
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
