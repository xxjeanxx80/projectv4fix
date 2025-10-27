import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { Booking } from '../bookings/entities/booking.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SpasModule } from '../spas/spas.module';
import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminLog } from './entities/admin-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminLog, Booking, Payment, User]),
    SpasModule,
    CampaignsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
