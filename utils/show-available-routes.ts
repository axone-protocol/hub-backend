import { NestExpressApplication } from '@nestjs/platform-express';

import { Log } from '@core/loggers/log';

export async function showAvailableRoutes(
  app: NestExpressApplication,
): Promise<void> {
  const server = app.getHttpServer();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const router = server._events.request._router.stack.filter((r) => r.route);

  for (const { route } of router) {
    Log.default(
      `${Object.keys(route.methods)[0].toUpperCase()}, ${route.path}`,
    );
  }
}
