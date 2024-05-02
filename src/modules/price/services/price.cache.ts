import { Injectable, OnModuleInit } from '@nestjs/common';

import { DBOrder } from '@core/enums/db-order.enum';
import { DBTimeInterval } from '@core/enums/db-time-interval.enum';
import { PrismaService } from '@core/lib/prisma.service';

import { HistoricalPrice } from '../dtos/historical-price.dto';
import { TimeBucketDto } from '../dtos/time-bucket.dto';
import { PriceRange } from '../enums/price-range.enum';

@Injectable()
export class PriceCache implements OnModuleInit {
  private all: HistoricalPrice[] = [];
  private day: HistoricalPrice[] = [];
  private week: HistoricalPrice[] = [];
  private month: HistoricalPrice[] = [];
  private threeMonth: HistoricalPrice[] = [];
  private year: HistoricalPrice[] = [];

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  async onModuleInit() {
    await this.init();
  }

  getCacheByRange(range: PriceRange): HistoricalPrice[] {
    switch (range) {
      case PriceRange.ALL:
        return this.all;
      case PriceRange.DAY:
        return this.day;
      case PriceRange.WEEK:
        return this.week;
      case PriceRange.MONTH:
        return this.month;
      case PriceRange.THREE_MONTH:
        return this.threeMonth;
      case PriceRange.YEAR:
        return this.year;
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
    this.threeMonth[this.threeMonth.length - 1] = (
      await this.timeBucket(DBTimeInterval.THREE_DAY, DBOrder.DESC, 1)
    )[0];
    this.year[this.year.length - 1] = (
      await this.timeBucket(DBTimeInterval.MONTH, DBOrder.DESC, 1)
    )[0];
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

  async initThreeMonthCache() {
    this.threeMonth = await this.timeBucket(
      DBTimeInterval.THREE_DAY,
      DBOrder.ASC,
      30,
    );
  }

  async initYearCache() {
    this.year = await this.timeBucket(DBTimeInterval.MONTH, DBOrder.DESC, 12);
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
}
