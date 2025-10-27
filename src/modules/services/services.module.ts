import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { SpasModule } from '../spas/spas.module';
import { Spa } from '../spas/entities/spa.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { SpaService } from './entities/service.entity';

@Module({
  imports: [ConfigModule, SpasModule, TypeOrmModule.forFeature([SpaService, Spa])],
  controllers: [ServicesController],
  providers: [
    ServicesService,
    {
      provide: 'SERVICES_EVENTS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'services.queue'),
    },
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
