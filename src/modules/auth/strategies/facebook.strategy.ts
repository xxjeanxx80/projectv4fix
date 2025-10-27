import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';
import { CustomStrategy } from './custom.strategy';

@Injectable()
export class FacebookStrategy extends PassportStrategy(CustomStrategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super('facebook');
  }

  async validate(req: Request): Promise<OAuthProfile> {
    const { accessToken, email, displayName } = (req.body ?? {}) as Record<string, string>;

    if (!this.configService.get<string>('FACEBOOK_CLIENT_ID')) {
      throw new UnauthorizedException('Facebook OAuth is not configured.');
    }

    if (!accessToken) {
      throw new UnauthorizedException('Facebook access token is required.');
    }

    if (!email) {
      throw new UnauthorizedException('Facebook profile email is required.');
    }

    return {
      email: email.toLowerCase(),
      provider: 'facebook',
      providerId: accessToken,
      displayName: displayName ?? 'Facebook User',
    };
  }
}
