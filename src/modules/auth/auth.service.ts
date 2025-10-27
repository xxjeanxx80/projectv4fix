import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { Role } from '../../common/decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { OAuthProfile } from './interfaces/oauth-profile.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
}

interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<ApiResponseDto<{ user: AuthenticatedUser; tokens: AuthTokens }>> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let user = this.usersRepo.create({
      name: dto.email.split('@')[0],
      email,
      password: hashedPassword,
      role: dto.role ?? Role.CUSTOMER,
      oauthProvider: 'local',
    });

    user = await this.usersRepo.save(user);

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return new ApiResponseDto({
      success: true,
      message: 'Registration successful.',
      data: {
        user: this.toAuthenticatedUser(user),
        tokens,
      },
    });
  }

  async login(dto: LoginDto): Promise<ApiResponseDto<{ user: AuthenticatedUser; tokens: AuthTokens }>> {
    const user = await this.validateUserCredentials(dto.email, dto.password);
    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return new ApiResponseDto({
      success: true,
      message: 'Login successful.',
      data: {
        user: this.toAuthenticatedUser(user),
        tokens,
      },
    });
  }

  async refreshTokens(
    dto: RefreshTokenDto,
  ): Promise<ApiResponseDto<{ tokens: AuthTokens }>> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') ?? this.configService.get<string>('JWT_SECRET');
    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token secret is not configured.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const refreshMatches = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
    if (!refreshMatches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return new ApiResponseDto({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: { tokens },
    });
  }

  async handleOAuthLogin(profile: OAuthProfile): Promise<ApiResponseDto<{ user: AuthenticatedUser; tokens: AuthTokens }>> {
    const email = profile.email.toLowerCase();
    let user = await this.usersRepo.findOne({ where: { email } });

    if (!user) {
      user = this.usersRepo.create({
        name: profile.displayName ?? profile.email.split('@')[0],
        email,
        password: null,
        role: Role.CUSTOMER,
        oauthProvider: profile.provider,
        oauthProviderId: profile.providerId,
      });
    } else {
      user.name = profile.displayName ?? user.name ?? profile.email.split('@')[0];
      user.oauthProvider = profile.provider;
      user.oauthProviderId = profile.providerId;
    }

    user = await this.usersRepo.save(user);

    const tokens = await this.issueTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);

    return new ApiResponseDto({
      success: true,
      message: `Logged in with ${profile.provider}.`,
      data: {
        user: this.toAuthenticatedUser(user),
        tokens,
      },
    });
  }

  private async validateUserCredentials(email: string, password: string): Promise<User> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email: normalizedEmail } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return user;
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') ?? this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update(userId, { refreshTokenHash });
  }

  private toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
