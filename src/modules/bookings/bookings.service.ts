import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { Coupon } from '../coupons/entities/coupon.entity';
import { Spa } from '../spas/entities/spa.entity';
import { SpaService } from '../services/entities/service.entity';
import { Staff } from '../staff/entities/staff.entity';
import { User } from '../users/entities/user.entity';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RescheduleBookingDto } from './dto/reschedule-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  private readonly commissionRate = 0.15;

  constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Spa) private readonly spaRepository: Repository<Spa>,
    @InjectRepository(SpaService) private readonly spaServiceRepository: Repository<SpaService>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Staff) private readonly staffRepository: Repository<Staff>,
    private readonly dataSource: DataSource,
    @Inject('PAYMENTS_CLIENT') private readonly paymentsClient: RmqClient,
    @Inject('NOTIFICATIONS_CLIENT') private readonly notificationsClient: RmqClient,
  ) {}

  async create(dto: CreateBookingDto) {
    const booking = await this.dataSource.transaction(async (manager) => {
      const spa = await manager.findOne(Spa, { where: { id: dto.spaId, isApproved: true } });
      if (!spa) {
        throw new NotFoundException('Spa not found or not approved.');
      }

      const service = await manager.findOne(SpaService, { where: { id: dto.serviceId, spaId: spa.id } });
      if (!service) {
        throw new NotFoundException('Service not found for spa.');
      }

      const customer = await manager.findOne(User, { where: { id: dto.customerId } });
      if (!customer) {
        throw new NotFoundException('Customer not found.');
      }

      let staff: Staff | null = null;
      if (dto.staffId) {
        staff = await manager.findOne(Staff, { where: { id: dto.staffId, spaId: spa.id, isActive: true } });
        if (!staff) {
          throw new NotFoundException('Staff member not available.');
        }
      } else {
        staff = await manager.findOne(Staff, { where: { spaId: spa.id, isActive: true } });
      }

      const servicePrice = Number(service.price);
      let discountPercent = 0;

      if (dto.couponCode) {
        const coupon = await manager.findOne(Coupon, { where: { code: dto.couponCode } });
        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Coupon is not available.');
        }

        if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
          throw new BadRequestException('Coupon expired.');
        }

        if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
          throw new BadRequestException('Coupon redemption limit reached.');
        }

        coupon.currentRedemptions += 1;
        await manager.save(Coupon, coupon);
        discountPercent = Number(coupon.discountPercent);
      }

      const finalPrice = this.applyDiscount(servicePrice, discountPercent);
      const commissionAmount = this.calculateCommission(finalPrice);

      const bookingEntity = manager.create(Booking, {
        spa,
        spaId: spa.id,
        service,
        serviceId: service.id,
        customer,
        customerId: customer.id,
        staff: staff ?? null,
        staffId: staff?.id ?? null,
        scheduledAt: new Date(dto.scheduledAt),
        status: BookingStatus.CONFIRMED,
        couponCode: dto.couponCode ?? null,
        totalPrice: servicePrice,
        finalPrice,
        commissionAmount,
      });

      return manager.save(bookingEntity);
    });

    this.paymentsClient.emit('BOOKING_COMPLETED', {
      bookingId: booking.id,
      amount: booking.finalPrice,
      commission: booking.commissionAmount,
    });

    this.notificationsClient.emit('NEW_BOOKING', {
      bookingId: booking.id,
      customerId: booking.customerId,
      spaId: booking.spaId,
      scheduledAt: booking.scheduledAt,
    });

    return new ApiResponseDto({ success: true, message: 'Booking confirmed.', data: booking });
  }

  async findAll() {
    const bookings = await this.bookingRepository.find();
    return new ApiResponseDto({ success: true, message: 'Bookings retrieved.', data: bookings });
  }

  async findOne(id: number) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    return new ApiResponseDto({ success: true, message: 'Booking retrieved.', data: booking });
  }

  async reschedule(id: number, dto: RescheduleBookingDto) {
    const booking = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Booking, { where: { id } });
      if (!existing) {
        throw new NotFoundException('Booking not found.');
      }

      existing.scheduledAt = new Date(dto.scheduledAt);
      existing.status = BookingStatus.CONFIRMED;
      return manager.save(existing);
    });

    this.notificationsClient.emit('BOOKING_RESCHEDULED', {
      bookingId: booking.id,
      scheduledAt: booking.scheduledAt,
    });

    return new ApiResponseDto({ success: true, message: 'Booking rescheduled.', data: booking });
  }

  async cancel(id: number, dto: CancelBookingDto) {
    const booking = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Booking, { where: { id } });
      if (!existing) {
        throw new NotFoundException('Booking not found.');
      }

      existing.status = BookingStatus.CANCELLED;
      return manager.save(existing);
    });

    this.notificationsClient.emit('BOOKING_CANCELLED', {
      bookingId: booking.id,
      reason: dto.reason ?? null,
    });

    return new ApiResponseDto({ success: true, message: 'Booking cancelled.', data: booking });
  }

  private applyDiscount(amount: number, percent: number) {
    if (!percent) {
      return Number(amount.toFixed(2));
    }

    const discounted = amount * ((100 - percent) / 100);
    return Number(discounted.toFixed(2));
  }

  private calculateCommission(amount: number) {
    return Number((amount * this.commissionRate).toFixed(2));
  }
}
