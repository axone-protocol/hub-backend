import { Injectable } from "@nestjs/common";
import { TokenService } from "./token.service";
import { Cron } from "@nestjs/schedule";
import { TokenCache } from "./token.cache";

@Injectable()
export class TokenJobs {
  constructor(
    private readonly service: TokenService,
    private readonly cache: TokenCache,
  ) { }
  
  @Cron('0 */24 * * *')
  async fetchTokenAndMcap() {
    await this.service.fetchAndSaveMcap();
    await this.service.fetchAndCacheTokenInfo();
  }

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