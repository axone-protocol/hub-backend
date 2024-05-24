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
    await this.service.initTokenHistoricalCache();
  }
}