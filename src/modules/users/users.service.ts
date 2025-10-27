import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoyaltyRank } from './enums/loyalty-rank.enum';
import { LoyaltyHistory } from './entities/loyalty-history.entity';
import { Loyalty } from './entities/loyalty.entity';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Loyalty) private readonly loyaltyRepo: Repository<Loyalty>,
    @InjectRepository(LoyaltyHistory) private readonly loyaltyHistoryRepo: Repository<LoyaltyHistory>,
  ) {}

  async create(dto: CreateUserDto): Promise<ApiResponseDto<{ user: User }>> {
    const email = dto.email.toLowerCase();

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists.');
    }

    const user = this.usersRepo.create({
      name: dto.name,
      email,
      password: await this.hashPassword(dto.password),
      role: dto.role ?? Role.CUSTOMER,
      oauthProvider: 'local',
    });

    const saved = await this.usersRepo.save(user);
    return new ApiResponseDto({
      success: true,
      message: 'User created successfully.',
      data: { user: this.sanitizeUser(saved) },
    });
  }

  async findAll(): Promise<ApiResponseDto<{ users: User[] }>> {
    const users = await this.usersRepo.find();
    return new ApiResponseDto({
      success: true,
      message: 'Users retrieved successfully.',
      data: { users: users.map((user) => this.sanitizeUser(user)) },
    });
  }

  async findOne(id: number): Promise<ApiResponseDto<{ user: User }>> {
    const user = await this.usersRepo.findOne({ where: { id }, relations: ['loyalty'] });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return new ApiResponseDto({
      success: true,
      message: 'User retrieved successfully.',
      data: { user: this.sanitizeUser(user) },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<ApiResponseDto<{ user: User }>> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const emailExists = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
      if (emailExists) {
        throw new ConflictException('Email already exists.');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.role) {
      user.role = dto.role;
    }

    if (dto.password) {
      user.password = await this.hashPassword(dto.password);
    }

    const saved = await this.usersRepo.save(user);

    return new ApiResponseDto({
      success: true,
      message: 'User updated successfully.',
      data: { user: this.sanitizeUser(saved) },
    });
  }

  async remove(id: number): Promise<ApiResponseDto<undefined>> {
    const result = await this.usersRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException('User not found.');
    }

    return new ApiResponseDto({ success: true, message: 'User deleted successfully.' });
  }

  async addPoints(customerId: number, points: number, reason: string): Promise<ApiResponseDto<{ loyalty: Loyalty }>> {
    if (!Number.isInteger(points) || points <= 0) {
      throw new BadRequestException('Points must be a positive integer.');
    }

    if (!reason?.trim()) {
      throw new BadRequestException('A reason for the loyalty update is required.');
    }

    const user = await this.usersRepo.findOne({ where: { id: customerId } });
    if (!user || user.role !== Role.CUSTOMER) {
      throw new NotFoundException('Customer not found.');
    }

    let loyalty = await this.loyaltyRepo.findOne({ where: { userId: user.id } });
    if (!loyalty) {
      loyalty = this.loyaltyRepo.create({ userId: user.id, points: 0, rank: LoyaltyRank.BRONZE });
    }

    loyalty.points += points;
    loyalty.rank = this.determineRank(loyalty.points);

    const saved = await this.loyaltyRepo.save(loyalty);

    const history = this.loyaltyHistoryRepo.create({
      userId: user.id,
      points,
      reason: reason.trim(),
    });
    await this.loyaltyHistoryRepo.save(history);

    return new ApiResponseDto({
      success: true,
      message: 'Loyalty points added successfully.',
      data: { loyalty: saved },
    });
  }

  async getRank(customerId: number): Promise<ApiResponseDto<{ rank: LoyaltyRank }>> {
    const loyalty = await this.loyaltyRepo.findOne({ where: { userId: customerId } });
    const rank = loyalty ? loyalty.rank : LoyaltyRank.BRONZE;
    return new ApiResponseDto({
      success: true,
      message: 'Loyalty rank retrieved successfully.',
      data: { rank },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private sanitizeUser(user: User): User {
    const clone: User = { ...user };
    clone.password = null;
    clone.refreshTokenHash = null;
    return clone;
  }

  private determineRank(points: number): LoyaltyRank {
    if (points >= 10000) {
      return LoyaltyRank.PLATINUM;
    }
    if (points >= 5000) {
      return LoyaltyRank.GOLD;
    }
    if (points >= 1000) {
      return LoyaltyRank.SILVER;
    }
    return LoyaltyRank.BRONZE;
  }
}
