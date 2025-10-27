import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { RmqClient } from '../../common/messaging/rmq-client';
import { CompletePayoutDto } from './dto/complete-payout.dto';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { ReviewPayoutDto } from './dto/review-payout.dto';
import { Payout, PayoutStatus } from './entities/payout.entity';

@Injectable()
export class PayoutsService {
  constructor(
    @InjectRepository(Payout) private readonly payoutRepository: Repository<Payout>,
    @Inject('ADMIN_CLIENT') private readonly adminClient: RmqClient,
  ) {}

  async requestPayout(dto: RequestPayoutDto) {
    const payout = this.payoutRepository.create({
      ownerId: dto.ownerId,
      amount: dto.amount,
      requestedAt: new Date(),
      notes: dto.notes ?? null,
    });

    const saved = await this.payoutRepository.save(payout);

    this.adminClient.emit('PAYOUT_REQUESTED', {
      payoutId: saved.id,
      ownerId: dto.ownerId,
      amount: dto.amount,
    });

    return new ApiResponseDto({ success: true, message: 'Payout requested.', data: saved });
  }

  async reviewPayout(dto: ReviewPayoutDto) {
    const payout = await this.payoutRepository.findOne({ where: { id: dto.payoutId } });
    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    if (payout.status !== PayoutStatus.REQUESTED) {
      throw new BadRequestException('Only requested payouts can be reviewed.');
    }

    if (dto.approved) {
      payout.status = PayoutStatus.APPROVED;
      payout.approvedAt = new Date();
    } else {
      payout.status = PayoutStatus.REJECTED;
      payout.notes = dto.notes ?? null;
    }

    const saved = await this.payoutRepository.save(payout);
    return new ApiResponseDto({ success: true, message: 'Payout review updated.', data: saved });
  }

  async completePayout(dto: CompletePayoutDto) {
    const payout = await this.payoutRepository.findOne({ where: { id: dto.payoutId } });
    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    if (payout.status !== PayoutStatus.APPROVED) {
      throw new BadRequestException('Only approved payouts can be completed.');
    }

    payout.status = PayoutStatus.COMPLETED;
    payout.completedAt = new Date();
    payout.notes = dto.notes ?? payout.notes ?? null;

    const saved = await this.payoutRepository.save(payout);
    return new ApiResponseDto({ success: true, message: 'Payout completed.', data: saved });
  }
}
