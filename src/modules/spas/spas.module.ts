import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createRmqClient } from '../../common/messaging/rmq-client';
import { User } from '../users/entities/user.entity';
import { Spa } from './entities/spa.entity';
import { SpasController } from './spas.controller';
import { SpasService } from './spas.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Spa, User])],
  controllers: [SpasController],
  providers: [
    SpasService,
    {
      provide: 'SPAS_EVENTS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createRmqClient(configService.get<string>('RABBITMQ_URL'), 'spas.queue'),
    },
  ],
  exports: [SpasService],
})
export class SpasModule {}
