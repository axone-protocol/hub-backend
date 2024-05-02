import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { HistoricalPriceCache } from './historical-price.cache';
import { HistoricalPriceService } from './historical-price.service';

@Injectable()
export class HistoricalPriceJobs {
  constructor(
    private readonly cache: HistoricalPriceCache,
    private readonly service: HistoricalPriceService,
  ) {}

  @Cron('*/5 * * * *')
  async fetchNewPrice() {
    await this.service.updateHistoryPrice();
    await this.cache.updateLastCache();
  }

  @Cron('* */2 * * *')
  async refreshDayCache() {
    await this.cache.initDayCache();
  }

  @Cron('* */6 * * *')
  async refreshWeekCache() {
    await this.cache.initWeekCache();
  }

  @Cron('* * */1 * *')
  async refreshMonthCache() {
    await this.cache.initMonthCache();
  }

  @Cron('* * */3 * *')
  async refreshThreeMonthCache() {
    await this.cache.initThreeMonthCache();
  }

  @Cron('* * * */1 *')
  async refreshYearCache() {
    await this.cache.initYearCache();
  }

  @Cron('* * * */1 *')
  async refreshAllCache() {
    await this.cache.initAllCache();
  }
}
