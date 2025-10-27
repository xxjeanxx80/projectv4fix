import { Injectable, Logger } from '@nestjs/common';

interface PublishPayload {
  pattern: string;
  data: unknown;
}

@Injectable()
export class RmqClient {
  private readonly logger = new Logger(RmqClient.name);

  constructor(private readonly options: { url: string; queue: string }) {}

  emit(pattern: string, data: unknown): PublishPayload {
    this.logger.debug(`Publishing ${pattern} to queue ${this.options.queue} via ${this.options.url}`);
    return { pattern, data };
  }
}

export function createRmqClient(url: string | undefined, queue: string) {
  return new RmqClient({ url: url ?? 'amqp://localhost:5672', queue });
}
