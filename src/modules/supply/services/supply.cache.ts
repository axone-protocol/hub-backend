import { DBOrder } from "@core/enums/db-order.enum";
import { DBTimeInterval } from "@core/enums/db-time-interval.enum";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@core/lib/prisma.service";
import { SupplyRange } from "../enums/supply-range.enum";
import { TimeBucketDto } from "../dtos/time-bucket.dto";
import { ChangeIntervalDto } from "../dtos/change-interval.dto";

@Injectable()
export class SupplyCache {
    private all: ChangeIntervalDto[] = [];
    private day: ChangeIntervalDto[] = [];
    private week: ChangeIntervalDto[] = [];
    private month: ChangeIntervalDto[] = [];
  
    constructor(private readonly prismaService: PrismaService) {}
  
    async onModuleInit() {
      await this.init();
    }
  
    getCacheByRange(range: SupplyRange): ChangeIntervalDto[] {
      switch (range) {
        case SupplyRange.ALL:
          return this.all;
        case SupplyRange.DAY:
          return this.day;
        case SupplyRange.WEEK:
          return this.week;
        case SupplyRange.MONTH:
          return this.month;
        default:
          console.log('Forgot to add new case');
          throw new Error();
      }
    }
  
    async updateLastCache() {
      this.all[this.all.length - 1] = (
        await this.timeBucket(DBTimeInterval.MONTH, DBOrder.DESC, 1)
      )[0];
      this.day[this.day.length - 1] = (
        await this.timeBucket(DBTimeInterval.TWO_HOUR, DBOrder.DESC, 1)
      )[0];
      this.week[this.week.length - 1] = (
        await this.timeBucket(DBTimeInterval.SIX_HOUR, DBOrder.DESC, 1)
      )[0];
      this.month[this.month.length - 1] = (
        await this.timeBucket(DBTimeInterval.DAY, DBOrder.DESC, 1)
      )[0];
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
      this.all = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.ASC);
    }
  
    async initDayCache() {
      this.day = await this.timeBucket(DBTimeInterval.TWO_HOUR, DBOrder.ASC, 12);
    }
  
    async initWeekCache() {
      this.week = await this.timeBucket(DBTimeInterval.SIX_HOUR, DBOrder.ASC, 28);
    }
  
    async initMonthCache() {
      this.month = await this.timeBucket(DBTimeInterval.DAY, DBOrder.ASC, 30);
    }
  
    async init() {
      await Promise.all([
        this.initAllCache(),
        this.initDayCache(),
        this.initWeekCache(),
        this.initMonthCache(),
      ]);
    }
}