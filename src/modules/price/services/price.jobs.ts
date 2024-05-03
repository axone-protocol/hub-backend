import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PriceCache } from './price.cache';
import { PriceService } from './price.service';

@Injectable()
export class PriceJobs {
  constructor(
    private readonly cache: PriceCache,
    private readonly service: PriceService,
  ) {}

  @Cron('*/5 * * * *')
  async fetchNewPrice() {
    await this.service.updateHistoryPrice();
    await this.cache.init();
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
