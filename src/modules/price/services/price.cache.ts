import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { DBTimeInterval } from '@core/enums/db-time-interval.enum';
import { PrismaService } from '@core/lib/prisma.service';
import { DBOrder } from '@core/enums/db-order.enum';

import { HistoricalPrice } from '../dtos/historical-price.dto';
import { TimeBucketDto } from '../dtos/time-bucket.dto';
import { PriceRange } from '../enums/price-range.enum';

@Injectable()
export class PriceCache implements OnModuleInit {
  private redisPricePrefix = 'price';

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }

  async onModuleInit() {
    await this.init();
  }

  async getCacheByRange(range: PriceRange): Promise<HistoricalPrice[]> {
    const serializedCache = await this.cacheService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }

  private async timeBucket(
    interval: DBTimeInterval,
    order: DBOrder,
    limit?: number,
  ): Promise<HistoricalPrice[]> {
    const bucket: TimeBucketDto[] = await this.prismaService.$queryRawUnsafe(`
            SELECT time_bucket('${interval}', time) as interval, avg(price) as avg_price
            FROM historical_prices
            GROUP BY interval
            ORDER BY interval ${order}
            ${limit ? `LIMIT ${limit}` : ''};
        `);
    return this.fromBucket(bucket);
  }

  private fromBucket(bucket: TimeBucketDto[]): HistoricalPrice[] {
    return bucket.map((item) => ({
      time: item.interval,
      price: item.avg_price,
    }));
  }

  //functions to refresh each cache

  async initAllCache() {
    const allBucket = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.ASC);
    this.cacheService.set(this.createRedisKey(PriceRange.ALL), JSON.stringify(allBucket));
  }

  async initDayCache() {
    const dayBucket = await this.timeBucket(DBTimeInterval.TWO_HOUR, DBOrder.ASC, 12);
    this.cacheService.set(this.createRedisKey(PriceRange.DAY), JSON.stringify(dayBucket));
  }

  async initWeekCache() {
    const weekBucket = await this.timeBucket(DBTimeInterval.SIX_HOUR, DBOrder.ASC, 28);
    this.cacheService.set(this.createRedisKey(PriceRange.WEEK), JSON.stringify(weekBucket));
  }

  async initMonthCache() {
    const monthBucket = await this.timeBucket(DBTimeInterval.DAY, DBOrder.ASC, 30);
    this.cacheService.set(this.createRedisKey(PriceRange.MONTH), JSON.stringify(monthBucket));
  }

  async initThreeMonthCache() {
    const threeMonthBucket = await this.timeBucket(DBTimeInterval.THREE_DAY, DBOrder.ASC, 30);
    this.cacheService.set(this.createRedisKey(PriceRange.THREE_MONTH), JSON.stringify(threeMonthBucket));
  }

  async initYearCache() {
    const yearBucket = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.DESC, 12);
    this.cacheService.set(this.createRedisKey(PriceRange.YEAR), JSON.stringify(yearBucket));
  }

  async init() {
    await Promise.all([
      this.initAllCache(),
      this.initDayCache(),
      this.initWeekCache(),
      this.initMonthCache(),
      this.initThreeMonthCache(),
      this.initYearCache(),
    ]);
  }

  private createRedisKey(range: PriceRange) {
    return `${this.redisPricePrefix}_${range}`;
  }
}
