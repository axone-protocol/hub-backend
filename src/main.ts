import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppExceptionsFilter } from '@core/exceptions-filter/app_exception.filter';
import { Log } from '@core/loggers/log';
import { NestLoggerImpl } from '@core/loggers/nest.logger';
import { AppModule } from '@modules/app.module';
import { showAvailableRoutes } from '@utils/show-available-routes';
import '@utils/config-loader';
import { config } from '@core/config/config';

(async () => {
  const app: NestExpressApplication =
    await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new NestLoggerImpl(),
    });

  app.enableCors();
  await app.listen(config.app.port, config.app.host);

  await showAvailableRoutes(app);

  Log.success(`${config.app.host}:${config.app.port}`);
})().catch(AppExceptionsFilter.catch);
