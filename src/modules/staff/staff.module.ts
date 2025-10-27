import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { SpasModule } from '../spas/spas.module';
import { Spa } from '../spas/entities/spa.entity';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffShift } from './entities/staff-shift.entity';
import { StaffSkill } from './entities/staff-skill.entity';
import { StaffTimeOff } from './entities/staff-time-off.entity';
import { Staff } from './entities/staff.entity';

@Module({
  imports: [ConfigModule, SpasModule, TypeOrmModule.forFeature([Staff, StaffSkill, StaffShift, StaffTimeOff, Spa])],
  controllers: [StaffController],
  providers: [
    StaffService,
    {
      provide: 'STAFF_EVENTS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'staff.queue'),
    },
  ],
  exports: [StaffService],
})
export class StaffModule {}
