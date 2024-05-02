import { Log } from '@core/loggers/log';

export class AppExceptionsFilter {
  static async catch(exception: Error): Promise<void> {
    Log.error(exception.toString());
  }
}
