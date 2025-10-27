export type OAuthProvider = 'google' | 'facebook';

export interface OAuthProfile {
  email: string;
  provider: OAuthProvider;
  providerId: string;
  displayName?: string;
}
