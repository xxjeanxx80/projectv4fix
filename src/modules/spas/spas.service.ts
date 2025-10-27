import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { Role } from '../../common/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';
import { ApproveSpaDto } from './dto/approve-spa.dto';
import { Spa } from './entities/spa.entity';

@Injectable()
export class SpasService {
  constructor(
    @InjectRepository(Spa) private readonly spaRepository: Repository<Spa>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject('SPAS_EVENTS') private readonly spaEventsClient: RmqClient,
  ) {}

  async create(ownerId: number, dto: CreateSpaDto) {
    const owner = await this.userRepository.findOne({ where: { id: ownerId } });
    if (!owner || owner.role !== Role.OWNER) {
      throw new NotFoundException('Owner not found.');
    }

    const spa = this.spaRepository.create({ ...dto, owner, ownerId });
    await this.spaRepository.save(spa);

    this.spaEventsClient.emit('spa.created', { spaId: spa.id, ownerId });

    return new ApiResponseDto({
      success: true,
      message: 'Spa created and pending approval.',
      data: spa,
    });
  }

  async findAll() {
    const spas = await this.spaRepository.find();
    return new ApiResponseDto({ success: true, message: 'Spas retrieved.', data: spas });
  }

  async findOne(id: number) {
    const spa = await this.spaRepository.findOne({ where: { id } });
    if (!spa) {
      throw new NotFoundException('Spa not found.');
    }

    return new ApiResponseDto({ success: true, message: 'Spa retrieved.', data: spa });
  }

  async update(id: number, dto: UpdateSpaDto) {
    const spa = await this.spaRepository.findOne({ where: { id } });
    if (!spa) {
      throw new NotFoundException('Spa not found.');
    }

    Object.assign(spa, dto);
    await this.spaRepository.save(spa);

    this.spaEventsClient.emit('spa.updated', { spaId: spa.id });

    return new ApiResponseDto({ success: true, message: 'Spa updated.', data: spa });
  }

  async approve(id: number, dto: ApproveSpaDto) {
    const spa = await this.spaRepository.findOne({ where: { id } });
    if (!spa) {
      throw new NotFoundException('Spa not found.');
    }

    spa.isApproved = dto.isApproved;
    await this.spaRepository.save(spa);

    this.spaEventsClient.emit('spa.approval', { spaId: spa.id, isApproved: spa.isApproved });

    return new ApiResponseDto({ success: true, message: 'Spa approval updated.', data: spa });
  }

  async remove(id: number) {
    const spa = await this.spaRepository.findOne({ where: { id } });
    if (!spa) {
      throw new NotFoundException('Spa not found.');
    }

    await this.spaRepository.delete(id);
    this.spaEventsClient.emit('spa.removed', { spaId: id });

    return new ApiResponseDto({ success: true, message: 'Spa removed.' });
  }
}
