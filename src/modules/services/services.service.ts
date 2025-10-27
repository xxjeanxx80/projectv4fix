import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { Spa } from '../spas/entities/spa.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { SpaService } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(SpaService) private readonly serviceRepository: Repository<SpaService>,
    @InjectRepository(Spa) private readonly spaRepository: Repository<Spa>,
    @Inject('SERVICES_EVENTS') private readonly servicesEventsClient: RmqClient,
  ) {}

  async create(dto: CreateServiceDto) {
    const spa = await this.spaRepository.findOne({ where: { id: dto.spaId } });
    if (!spa || !spa.isApproved) {
      throw new NotFoundException('Spa not found or not approved.');
    }

    const service = this.serviceRepository.create({ ...dto, spa });
    await this.serviceRepository.save(service);

    this.servicesEventsClient.emit('service.created', { serviceId: service.id, spaId: service.spaId });

    return new ApiResponseDto({ success: true, message: 'Service created.', data: service });
  }

  async findAll() {
    const services = await this.serviceRepository.find();
    return new ApiResponseDto({ success: true, message: 'Services retrieved.', data: services });
  }

  async findOne(id: number) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return new ApiResponseDto({ success: true, message: 'Service retrieved.', data: service });
  }

  async update(id: number, dto: UpdateServiceDto) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    Object.assign(service, dto);
    await this.serviceRepository.save(service);

    this.servicesEventsClient.emit('service.updated', { serviceId: service.id });

    return new ApiResponseDto({ success: true, message: 'Service updated.', data: service });
  }

  async remove(id: number) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    await this.serviceRepository.delete(id);
    this.servicesEventsClient.emit('service.removed', { serviceId: id });

    return new ApiResponseDto({ success: true, message: 'Service removed.' });
  }
}
