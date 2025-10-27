import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(@InjectRepository(Coupon) private readonly couponRepository: Repository<Coupon>) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.couponRepository.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException('Coupon code already exists.');
    }

    const coupon = this.couponRepository.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.couponRepository.save(coupon);
    return new ApiResponseDto({ success: true, message: 'Coupon created.', data: saved });
  }

  async findAll() {
    const coupons = await this.couponRepository.find();
    return new ApiResponseDto({ success: true, message: 'Coupons retrieved.', data: coupons });
  }

  async findOne(id: number) {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }

    return new ApiResponseDto({ success: true, message: 'Coupon retrieved.', data: coupon });
  }

  async update(id: number, dto: UpdateCouponDto) {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }

    Object.assign(coupon, dto, {
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : coupon.expiresAt,
    });

    const saved = await this.couponRepository.save(coupon);
    return new ApiResponseDto({ success: true, message: 'Coupon updated.', data: saved });
  }

  async remove(id: number) {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found.');
    }

    await this.couponRepository.delete(id);
    return new ApiResponseDto({ success: true, message: 'Coupon removed.' });
  }

  async validateCode(code: string) {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    if (!coupon || !coupon.isActive) {
      throw new NotFoundException('Coupon is not available.');
    }

    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Coupon expired.');
    }

    if (coupon.maxRedemptions && coupon.currentRedemptions >= coupon.maxRedemptions) {
      throw new BadRequestException('Coupon redemption limit reached.');
    }

    coupon.currentRedemptions += 1;
    await this.couponRepository.save(coupon);

    return coupon;
  }
}
