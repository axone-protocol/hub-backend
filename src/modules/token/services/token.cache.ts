import { Injectable } from "@nestjs/common";
import { TokenInfoDto } from "../dtos/token-info.dto";
import { HistoricalPrice } from "../dtos/historical-price.dto";
import { DBTimeInterval } from "@core/enums/db-time-interval.enum";
import { DBOrder } from "@core/enums/db-order.enum";
import { TimeBucketDto } from "../dtos/time-bucket.dto";
import { PrismaService } from "@core/lib/prisma.service";
import { Range } from "@core/enums/range.enum";
import { RedisService } from "@core/lib/redis.service";

@Injectable()
export class TokenCache {
  private redisTokenPrefix = 'token';
  private tokenInfoPrefix = 'info';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) { }

  async onModuleInit() {
    await this.init();
  }
    
  async getCacheByRange(range: Range): Promise<HistoricalPrice[]> {
    const serializedCache = await this.redisService.get(this.createRedisKey(range));
    return JSON.parse(serializedCache as string);
  }

  async cacheTokenInfo(info: TokenInfoDto) {
    const serialized = JSON.stringify(info);
    await this.redisService.set(this.createRedisKey(this.tokenInfoPrefix), serialized);
  }

  async getTokenInfo() {
    const serialized = await this.redisService.get(this.createRedisKey(this.tokenInfoPrefix));

    if (!serialized) {
      return {};
    }

    return JSON.parse(serialized as string);
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
    this.redisService.set(this.createRedisKey(Range.ALL), JSON.stringify(allBucket));
  }
    
  async initDayCache() {
    const dayBucket = await this.timeBucket(DBTimeInterval.TWO_HOUR, DBOrder.ASC, 12);
    this.redisService.set(this.createRedisKey(Range.DAY), JSON.stringify(dayBucket));
  }
    
  async initWeekCache() {
    const weekBucket = await this.timeBucket(DBTimeInterval.SIX_HOUR, DBOrder.ASC, 28);
    this.redisService.set(this.createRedisKey(Range.WEEK), JSON.stringify(weekBucket));
  }
    
  async initMonthCache() {
    const monthBucket = await this.timeBucket(DBTimeInterval.DAY, DBOrder.ASC, 30);
    this.redisService.set(this.createRedisKey(Range.MONTH), JSON.stringify(monthBucket));
  }
    
  async initThreeMonthCache() {
    const threeMonthBucket = await this.timeBucket(DBTimeInterval.THREE_DAY, DBOrder.ASC, 30);
    this.redisService.set(this.createRedisKey(Range.THREE_MONTH), JSON.stringify(threeMonthBucket));
  }
    
  async initYearCache() {
    const yearBucket = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.DESC, 12);
    this.redisService.set(this.createRedisKey(Range.YEAR), JSON.stringify(yearBucket));
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

  private createRedisKey(id: string) {
    return `${this.redisTokenPrefix}_${id}`;
  }
}