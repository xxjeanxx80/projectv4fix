import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';
import { CustomStrategy } from './custom.strategy';

@Injectable()
export class GoogleStrategy extends PassportStrategy(CustomStrategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super('google');
  }

  async validate(req: Request): Promise<OAuthProfile> {
    const { accessToken, email, displayName } = (req.body ?? {}) as Record<string, string>;

    if (!this.configService.get<string>('GOOGLE_CLIENT_ID')) {
      throw new UnauthorizedException('Google OAuth is not configured.');
    }

    if (!accessToken) {
      throw new UnauthorizedException('Google access token is required.');
    }

    if (!email) {
      throw new UnauthorizedException('Google profile email is required.');
    }

    return {
      email: email.toLowerCase(),
      provider: 'google',
      providerId: accessToken,
      displayName: displayName ?? 'Google User',
    };
  }
}
