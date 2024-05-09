import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { SupplyModule } from './supply/supply.module';
import { StackingModule } from './stacking/stacking.module';
import { config } from '@core/config/config';
import { TokenModule } from './token/token.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: config.redis.host,
      port: config.redis.port,
    }),
    TokenModule,
    SupplyModule,
    StackingModule,
  ],
})
export class AppModule {}
