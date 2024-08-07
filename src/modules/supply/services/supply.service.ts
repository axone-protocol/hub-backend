import { Injectable, OnModuleInit } from "@nestjs/common";
import Big from 'big.js';

import { config } from "@core/config/config";
import { DBOrder } from "@core/enums/db-order.enum";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { PrismaService } from "@core/lib/prisma.service";

import { CurrentSupplyDto } from "../dtos/current-supply.dto";
import { Range } from "@core/enums/range.enum";
import { HistoricalChartConf, RangeHistoricalChartConf } from "@core/types/range-historical-chart-conf.dto";
import { DBTimeInterval } from "@core/enums/db-time-interval.enum";
import { Log } from "@core/loggers/log";
import { SupplyCache } from "./supply.cache";
import { TimeBucketDto } from "../dtos/time-bucket.dto";
import { SupplyIntervalDto } from "../dtos/supply-interval.dto";
import { SupplyChangeDto } from "../dtos/supply-change.dto";
import { ChangeSupplyDto } from "../dtos/change-supply.dto";

@Injectable()
export class SupplyService implements OnModuleInit {
  private rangeTimeIntervalMap: RangeHistoricalChartConf;
  
  constructor(
    private readonly okp4Service: Okp4Service,
    private readonly prismaService: PrismaService,
    private readonly cache: SupplyCache,
  ) {
    this.rangeTimeIntervalMap = new Map([
      [Range.DAY, { interval: DBTimeInterval.TWO_HOUR, count: 12 }],
      [Range.WEEK, { interval: DBTimeInterval.SIX_HOUR, count: 28 }],
      [Range.MONTH, { interval: DBTimeInterval.DAY, count: 30 }],
      [Range.YEAR, { interval: DBTimeInterval.MONTH, count: 12 }],
      [Range.ALL, { interval: DBTimeInterval.MONTH}],
    ]);
  }

  async onModuleInit() {
    await this.initSupplyHistoricalCache();
  }
  
  async initSupplyHistoricalCache() {
    const promises = [];

    for (const [range, conf] of this.rangeTimeIntervalMap) {
      promises.push(this.calculateAndCacheSupplyHistoricalPrice(range, conf));
    }

    await Promise.all(promises);
  }

  private async calculateAndCacheSupplyHistoricalPrice(range: Range, { interval, count }: HistoricalChartConf) {
    try {
      const historicalPrice = await this.timeBucket(interval, DBOrder.ASC, count);
      await this.cache.setSupplyHistorical(range, historicalPrice);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      Log.warn("Failed to cache supply historical price " + e.message);
    }
  }

  private async timeBucket(
    interval: DBTimeInterval,
    order: DBOrder,
    limit?: number,
  ) {
    const bucket: TimeBucketDto[] = await this.prismaService.$queryRawUnsafe(`
        SELECT time_bucket('${interval}', time) as interval, avg(CAST(supply AS DECIMAL)) as avg_supply
        FROM historical_supply
        GROUP BY interval
        ORDER BY interval ${order}
        ${limit ? `LIMIT ${limit}` : ''};
    `);
    return this.addChangePercent(this.fromBucket(bucket));
  }

  private addChangePercent(intervalSupply: SupplyIntervalDto[]): ChangeSupplyDto[] {
    const changeSupply: ChangeSupplyDto[] = [];
    for (let i = 0; i < intervalSupply.length; i++) {
      if(i === 0) {
        changeSupply[i] = {
          ...intervalSupply[i],
          percentChange: "0"
        }
      } else {
        changeSupply[i] = {
          ...intervalSupply[i],
          percentChange: Big(this.calculateSupplyChange(intervalSupply[i].change, intervalSupply[i-1].change)).toFixed(2),
        }
      }
    }

    return changeSupply;
  }

  private fromBucket(bucket: TimeBucketDto[]): SupplyIntervalDto[] {
    return bucket.map((item) => ({
      time: item.interval,
      change: item.avg_supply,
    }));
  }
    
  async fetchAndSaveCurrentSupply() {
    try {
      const currentSupply = await this.fetchCurrentSupply();
      await this.prismaService.historicalSupply.create({
        data: currentSupply,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  private async fetchCurrentSupply(): Promise<CurrentSupplyDto> {
    const { amount: { amount: supply } } = await this.okp4Service.getSupplyByDenom(config.app.tokenDenom);
    const time = new Date();

    return {
      time,
      supply,
    }
  }

  async getSupplyByOrder(order = DBOrder.DESC) {
    return this.prismaService.historicalSupply.findFirst({
      orderBy: {
        time: order,
      },
    });
  }

  private calculateSupplyChange(newSupply?: string, pastSupply?: string) {
    let change = 0;

    if (newSupply && pastSupply) {
      if (Number.parseFloat(pastSupply) === 0) {
        change = Big(newSupply).toNumber();
      } else {
        change = Big(newSupply).minus(pastSupply).div(pastSupply).mul(100).toNumber();
      }
    }
        
    return change;
  }

  async getSupplyChange(range: Range) {
    const cache = await this.cache.getSupplyChange(range) as SupplyChangeDto;

    if(cache === null) {
      return this.cacheSupplyChange(range);
    }

    return cache;
  }

  private async cacheSupplyChange(range: Range) {
    const previousSupply = await this.getPastSupplyByRange(range);
    const currentSupply = await this.getSupplyByOrder();
    const supplyChange: SupplyChangeDto = {
      time: new Date(),
      change: '0',
      burnt: '0',
      issuance: '0',
    };

    if (previousSupply && currentSupply) {
      supplyChange.time = currentSupply.time;
      supplyChange.issuance = Big(currentSupply.supply).minus(previousSupply.supply).toFixed(2);
      supplyChange.change = Big(supplyChange.issuance).minus(supplyChange.burnt).toFixed(2);
    }

    await this.cache.setSupplyChange(range, supplyChange);

    return supplyChange;
  }

  private async getPastSupplyByRange(range: Range) {
    const dateByRange = this.calculatePastDateByRange(range);
    const supply = await this.prismaService.historicalSupply.findFirst({
      where: {
        time: {
          lte: dateByRange,
        }
      },
      orderBy: {
        time: DBOrder.DESC
      },
    });

    if (!supply) {
      return this.getSupplyByOrder(DBOrder.ASC);
    }

    return supply;
  }

  private calculatePastDateByRange(range: Range): Date {
    let date = new Date();
    switch (range) {
      case Range.DAY: date = new Date(date.setDate(date.getDate() - 1)); break;
      case Range.WEEK: date = new Date(date.setDate(date.getDate() - 7)); break;
      case Range.MONTH: date = new Date(date.setMonth(date.getMonth() - 1)); break;
      case Range.YEAR: date = new Date(date.setFullYear(date.getFullYear() - 1)); break;
    }

    return date;
  }

  async getSupplyGrowth(range: Range) {
    const pastDate = this.calculatePastDateByRange(range);
    const pastSupply = await this.prismaService.historicalSupply.findFirst({
      where: {
        time: {
          gte: pastDate
        }
      },
      orderBy: {
        time: 'asc'
      }
    });
  
    const currentSupply = await this.getSupplyByOrder();

    return this.calculateSupplyChange(currentSupply?.supply, pastSupply?.supply);
  }

  async getCharts(range: Range) {
    const res = await this.getSupplyChange(range);
    const growth = await this.getSupplyGrowth(range);

    return {
      issuance: res.issuance,
      growth: Big(growth).toFixed(2),
      burnt: res.burnt,
    }
  }
}