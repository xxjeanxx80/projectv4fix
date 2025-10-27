import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { SendNotificationDto } from './dto/send-notification.dto';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
    @Inject('NOTIFICATIONS_PUBLISHER') private readonly notificationsClient: RmqClient,
  ) {}

  async send(dto: SendNotificationDto) {
    const notification = this.notificationRepository.create({
      channel: dto.channel,
      userId: dto.userId ?? null,
      payload: { message: dto.message, meta: dto.meta ?? null },
      status: NotificationStatus.QUEUED,
    });

    const saved = await this.notificationRepository.save(notification);

    this.notificationsClient.emit(`notifications.${dto.channel.toLowerCase()}`, {
      notificationId: saved.id,
      userId: saved.userId,
      channel: saved.channel,
      payload: saved.payload,
    });

    saved.status = NotificationStatus.SENT;
    const updated = await this.notificationRepository.save(saved);

    return new ApiResponseDto({ success: true, message: 'Notification dispatched.', data: updated });
  }
}
