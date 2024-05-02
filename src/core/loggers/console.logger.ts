import { blue, bold, green, red, whiteBright, yellow } from 'colorette';

import { nowUtcFormatted } from '@utils/now-utc-formatted';

import { Loggable } from './loggable.interface';

class ConsoleLoggerImpl implements Loggable {
  default(message: string): void {
    process.stdout.write(
      `[${bold(nowUtcFormatted())}] ${LoggableHint.DEFAULT} ${whiteBright(
        message,
      )}\n`,
    );
  }

  info(message: string): void {
    process.stdout.write(
      `[${bold(nowUtcFormatted())}] ${LoggableHint.INFO} ${blue(message)}\n`,
    );
  }

  warn(message: string): void {
    process.stdout.write(
      `[${bold(nowUtcFormatted())}] ${LoggableHint.WARNING} ${yellow(
        message,
      )}\n`,
    );
  }

  error(message: string): void {
    process.stdout.write(
      `[${bold(nowUtcFormatted())}] ${LoggableHint.ERROR} ${red(message)}\n`,
    );
  }

  success(message: string): void {
    process.stdout.write(
      `[${bold(nowUtcFormatted())}] ${LoggableHint.SUCCESS} ${green(
        message,
      )}\n`,
    );
  }
}

export function ConsoleLogger(): Loggable {
  return new ConsoleLoggerImpl();
}
