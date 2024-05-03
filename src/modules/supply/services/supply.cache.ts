import { Inject, Injectable } from "@nestjs/common";
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from "@nestjs/cache-manager";

import { DBOrder } from "@core/enums/db-order.enum";
import { DBTimeInterval } from "@core/enums/db-time-interval.enum";
import { PrismaService } from "@core/lib/prisma.service";

import { SupplyRange } from "../enums/supply-range.enum";
import { TimeBucketDto } from "../dtos/time-bucket.dto";
import { ChangeIntervalDto } from "../dtos/change-interval.dto";

@Injectable()
export class SupplyCache {
  private redisSupplyPrefix = 'supply';
  
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) { }
  
  async onModuleInit() {
    await this.init();
  }
  
  async getCacheByRange(range: SupplyRange): Promise<ChangeIntervalDto[]> {
    const serializedCache = await this.cacheService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }
  
  private async timeBucket(
    interval: DBTimeInterval,
    order: DBOrder,
    limit?: number,
  ) {
    const bucket: TimeBucketDto[] = await this.prismaService.$queryRawUnsafe(`
        SELECT time_bucket('${interval}', time) as interval, sum(change) as sum_change
        FROM historical_supply
        GROUP BY interval
        ORDER BY interval ${order}
        ${limit ? `LIMIT ${limit}` : ''};
    `);
    return this.fromBucket(bucket);
  }
  
  private fromBucket(bucket: TimeBucketDto[]): ChangeIntervalDto[] {
    return bucket.map((item) => ({
      time: item.interval,
      change: item.sum_change,
    }));
  }
  
  //functions to refresh each cache

  async initAllCache() {
    const allBucket = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.ASC);
    this.cacheService.set(this.createRedisKey(SupplyRange.ALL), JSON.stringify(allBucket));
  }

  async initDayCache() {
    const dayBucket = await this.timeBucket(DBTimeInterval.TWO_HOUR, DBOrder.ASC, 12);
    this.cacheService.set(this.createRedisKey(SupplyRange.DAY), JSON.stringify(dayBucket));
  }

  async initWeekCache() {
    const weekBucket = await this.timeBucket(DBTimeInterval.SIX_HOUR, DBOrder.ASC, 28);
    this.cacheService.set(this.createRedisKey(SupplyRange.WEEK), JSON.stringify(weekBucket));
  }

  async initMonthCache() {
    const monthBucket = await this.timeBucket(DBTimeInterval.DAY, DBOrder.ASC, 30);
    this.cacheService.set(this.createRedisKey(SupplyRange.MONTH), JSON.stringify(monthBucket));
  }

  async init() {
    await Promise.all([
      this.initAllCache(),
      this.initDayCache(),
      this.initWeekCache(),
      this.initMonthCache(),
    ]);
  }

  private createRedisKey(range: SupplyRange) {
    return `${this.redisSupplyPrefix}_${range}`;
  }
}