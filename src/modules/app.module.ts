import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

import { PriceModule } from './price/price.module';
import { SupplyModule } from './supply/supply.module';
import { config } from '@core/config/config';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: config.redis.host,
      port: config.redis.port,
    }),
    PriceModule,
    SupplyModule,
  ],
})
export class AppModule {}
