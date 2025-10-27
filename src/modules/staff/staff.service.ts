import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { Spa } from '../spas/entities/spa.entity';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { RequestTimeOffDto } from './dto/request-time-off.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffShift } from './entities/staff-shift.entity';
import { StaffSkill } from './entities/staff-skill.entity';
import { StaffTimeOff } from './entities/staff-time-off.entity';
import { Staff } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff) private readonly staffRepository: Repository<Staff>,
    @InjectRepository(StaffSkill) private readonly skillRepository: Repository<StaffSkill>,
    @InjectRepository(StaffShift) private readonly shiftRepository: Repository<StaffShift>,
    @InjectRepository(StaffTimeOff) private readonly timeOffRepository: Repository<StaffTimeOff>,
    @InjectRepository(Spa) private readonly spaRepository: Repository<Spa>,
    @Inject('STAFF_EVENTS') private readonly staffEventsClient: RmqClient,
  ) {}

  async create(dto: CreateStaffDto) {
    const spa = await this.spaRepository.findOne({ where: { id: dto.spaId } });
    if (!spa) {
      throw new NotFoundException('Spa not found.');
    }

    const staff = this.staffRepository.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      spa,
      spaId: dto.spaId,
      skills: dto.skills?.map((name) => this.skillRepository.create({ name })),
    });

    await this.staffRepository.save(staff);

    this.staffEventsClient.emit('staff.created', { staffId: staff.id, spaId: staff.spaId });

    return new ApiResponseDto({ success: true, message: 'Staff member created.', data: staff });
  }

  async findAll() {
    const staff = await this.staffRepository.find({ relations: ['skills', 'shifts', 'timeOff'] });
    return new ApiResponseDto({ success: true, message: 'Staff members retrieved.', data: staff });
  }

  async findOne(id: number) {
    const staff = await this.staffRepository.findOne({ where: { id }, relations: ['skills', 'shifts', 'timeOff'] });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    return new ApiResponseDto({ success: true, message: 'Staff member retrieved.', data: staff });
  }

  async update(id: number, dto: UpdateStaffDto) {
    const staff = await this.staffRepository.findOne({ where: { id }, relations: ['skills'] });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    Object.assign(staff, dto);

    if (dto.skills) {
      await this.skillRepository.delete({ staffId: staff.id });
      staff.skills = dto.skills.map((name) => this.skillRepository.create({ name, staff }));
    }

    await this.staffRepository.save(staff);

    this.staffEventsClient.emit('staff.updated', { staffId: staff.id });

    return new ApiResponseDto({ success: true, message: 'Staff member updated.', data: staff });
  }

  async remove(id: number) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    await this.staffRepository.delete(id);
    this.staffEventsClient.emit('staff.removed', { staffId: id });

    return new ApiResponseDto({ success: true, message: 'Staff member removed.' });
  }

  async assignShift(id: number, dto: AssignShiftDto) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    const shift = this.shiftRepository.create({
      staff,
      staffId: id,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
    });

    await this.shiftRepository.save(shift);
    this.staffEventsClient.emit('staff.shift.assigned', { staffId: id, shiftId: shift.id });

    return new ApiResponseDto({ success: true, message: 'Shift assigned.', data: shift });
  }

  async requestTimeOff(id: number, dto: RequestTimeOffDto) {
    const staff = await this.staffRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('Staff member not found.');
    }

    const timeOff = this.timeOffRepository.create({
      staff,
      staffId: id,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      reason: dto.reason ?? null,
    });

    await this.timeOffRepository.save(timeOff);
    this.staffEventsClient.emit('staff.timeoff.requested', { staffId: id, timeOffId: timeOff.id });

    return new ApiResponseDto({ success: true, message: 'Time off recorded.', data: timeOff });
  }
}
