import { LoggerService } from '@nestjs/common';

import { Log } from '@core/loggers/log';

export class NestLoggerImpl implements LoggerService {
  async log(message: string): Promise<void> {
    return Log.info(message);
  }

  async error(message: string): Promise<void> {
    return Log.error(message);
  }

  async warn(message: string): Promise<void> {
    return Log.warn(message);
  }
}
