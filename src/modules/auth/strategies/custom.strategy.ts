import { Strategy } from 'passport';
import type { Request } from 'express';

type VerifiedCallback<TUser> = (error: unknown, user?: TUser, info?: unknown) => void;

export class CustomStrategy<TUser = Record<string, unknown>> extends Strategy {
  private readonly verify: (req: Request, done: VerifiedCallback<TUser>) => void;

  constructor(name: string, verify: (req: Request, done: VerifiedCallback<TUser>) => void) {
    super();
    this.name = name;
    this.verify = verify;
  }

  authenticate(req: Request): void {
    try {
      this.verify(req, (error, user, info) => {
        if (error) {
          this.error(error as Error);
          return;
        }

        if (!user) {
          const message = typeof info === 'string' ? info : `${this.name} authentication failed`;
          this.fail(message, 401);
          return;
        }

        this.success(user as Record<string, unknown>);
      });
    } catch (error) {
      this.error(error as Error);
    }
  }
}
