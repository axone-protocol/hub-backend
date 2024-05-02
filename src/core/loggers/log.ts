import { ConsoleLogger } from '@core/loggers/console.logger';

import { Loggable } from './loggable.interface';

export class Log {
  private static loggers: Loggable[] = [ConsoleLogger()];

  static async default(message: string): Promise<void> {
    await Promise.allSettled(
      Log.loggers.map((logger) =>
        logger?.default ? logger.default(message) : null,
      ),
    );
  }

  static async info(message: string): Promise<void> {
    await Promise.allSettled(
      Log.loggers.map((logger) => (logger?.info ? logger.info(message) : null)),
    );
  }

  static async warn(message: string): Promise<void> {
    await Promise.allSettled(Log.loggers.map((logger) => logger.warn(message)));
  }

  static async error(message: string): Promise<void> {
    await Promise.allSettled(
      Log.loggers.map((logger) => logger.error(message)),
    );
  }

  static async success(message: string): Promise<void> {
    await Promise.allSettled(
      Log.loggers.map((logger) => logger.success(message)),
    );
  }
}
