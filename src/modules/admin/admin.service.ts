import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Role } from '../../common/enums/role.enum';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { ApproveSpaDto } from '../spas/dto/approve-spa.dto';
import { SpasService } from '../spas/spas.service';
import { User } from '../users/entities/user.entity';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { AdminLog } from './entities/admin-log.entity';

export interface MetricsPayload {
  totalBookings: number;
  totalRevenue: number;
  newCustomers: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminLog) private readonly adminLogRepository: Repository<AdminLog>,
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Payment) private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly spasService: SpasService,
    private readonly campaignsService: CampaignsService,
  ) {}

  async getMetrics() {
    const metrics = await this.calculateMetrics();
    return new ApiResponseDto({
      success: true,
      message: 'Administrative metrics generated.',
      data: metrics,
    });
  }

  async approveSpa(spaId: number, dto: ApproveSpaDto, adminId: number) {
    const response = await this.spasService.approve(spaId, dto);
    await this.recordLog(adminId, 'SPA_APPROVAL', {
      spaId,
      approved: dto.isApproved,
    });
    return response;
  }

  async updateCampaignStatus(campaignId: number, dto: UpdateCampaignStatusDto, adminId: number) {
    const response = await this.campaignsService.update(campaignId, { isActive: dto.isActive });
    await this.recordLog(adminId, 'CAMPAIGN_STATUS_UPDATE', {
      campaignId,
      isActive: dto.isActive,
    });
    return response;
  }

  async getLogs() {
    const logs = await this.adminLogRepository.find({ order: { createdAt: 'DESC' } });
    return new ApiResponseDto({ success: true, message: 'Admin logs retrieved.', data: logs });
  }

  private async calculateMetrics(): Promise<MetricsPayload> {
    const confirmedBookings = await this.bookingRepository.find({ where: { status: BookingStatus.CONFIRMED } });
    const completedPayments = await this.paymentRepository.find({ where: { status: PaymentStatus.COMPLETED } });
    const customerAccounts = await this.userRepository.find({ where: { role: Role.CUSTOMER } });

    const totalRevenue = completedPayments.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const newCustomers = customerAccounts.filter((user) => user.createdAt && user.createdAt >= since).length;

    return {
      totalBookings: confirmedBookings.length,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      newCustomers,
    };
  }

  private async recordLog(adminId: number, action: string, details?: Record<string, unknown>) {
    const entry = this.adminLogRepository.create({
      adminId,
      action,
      details: details ?? null,
    });
    await this.adminLogRepository.save(entry);
  }
}
