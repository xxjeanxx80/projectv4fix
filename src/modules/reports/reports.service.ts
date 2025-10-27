import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { Report, ReportStatus } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(@InjectRepository(Report) private readonly reportRepository: Repository<Report>) {}

  async create(reporterId: number, dto: CreateReportDto) {
    const report = this.reportRepository.create({
      ...dto,
      reporterId,
      status: ReportStatus.OPEN,
    });
    const saved = await this.reportRepository.save(report);
    return new ApiResponseDto({ success: true, message: 'Report submitted.', data: saved });
  }

  async findAll() {
    const reports = await this.reportRepository.find();
    return new ApiResponseDto({ success: true, message: 'Reports retrieved.', data: reports });
  }

  async resolve(id: number, dto: ResolveReportDto) {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) {
      throw new NotFoundException('Report not found.');
    }

    report.status = ReportStatus.RESOLVED;
    report.resolutionNotes = dto.notes ?? null;
    const saved = await this.reportRepository.save(report);
    return new ApiResponseDto({ success: true, message: 'Report resolved.', data: saved });
  }
}
