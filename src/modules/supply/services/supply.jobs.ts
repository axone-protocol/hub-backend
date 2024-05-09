import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SupplyService } from "./supply.service";
import { SupplyCache } from "./supply.cache";

@Injectable()
export class SupplyJobs {
  constructor(
    private readonly service: SupplyService,
    private readonly cache: SupplyCache,
  ) { }
    
  @Cron('* * * * *')
  async fetchNewPrice() {
    await this.service.fetchAndSaveCurrentSupply();
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

  @Cron('* * * */1 *')
  async refreshAllCache() {
    await this.cache.initAllCache();
  }
}