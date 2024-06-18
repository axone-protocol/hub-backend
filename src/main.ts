import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppExceptionsFilter } from '@core/exceptions-filter/app_exception.filter';
import { Log } from '@core/loggers/log';
import { NestLoggerImpl } from '@core/loggers/nest.logger';
import { AppModule } from '@modules/app.module';
import { showAvailableRoutes } from '@utils/show-available-routes';
import { config } from '@core/config/config';
import '@utils/config-loader';

(async () => {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new NestLoggerImpl(),
    });

  app.enableCors();
  await app.listen(config.app.port, config.app.host);

  await showAvailableRoutes(app);
  Log.success(`Application is running on: ${await app.getUrl()}`);
})().catch(AppExceptionsFilter.catch);
