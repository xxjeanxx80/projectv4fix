import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from '../../common/decorators/auth.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Auth(Role.ADMIN)
  send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }
}
