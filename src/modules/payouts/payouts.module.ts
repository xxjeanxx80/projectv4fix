import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { Payout } from './entities/payout.entity';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Payout])],
  controllers: [PayoutsController],
  providers: [
    PayoutsService,
    {
      provide: 'ADMIN_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get('RABBITMQ_URL'), 'admin.queue'),
    },
  ],
})
export class PayoutsModule {}
