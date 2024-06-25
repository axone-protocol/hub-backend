import { ExchangeRateService } from "@core/lib/exchange-rate.service";
import { RedisService } from "@core/lib/redis.service";
import { Log } from "@core/loggers/log";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import Big from "big.js";

@Injectable()
export class GeneralService implements OnModuleInit {
  constructor(
    private readonly exchangeRate: ExchangeRateService,
    private readonly redisService: RedisService
  ) {}
  async onModuleInit() {
    await this.fetchAndCacheExchangeRates();
  }

  @Cron("0 1 * * *")
  async fetchAndCacheExchangeRates() {
    const rateRes = await this.exchangeRate.getLatest();
    const dto = {
      EUR: +Big(rateRes.conversion_rates.EUR).toFixed(2),
      USD: +Big(1).div(rateRes.conversion_rates.EUR).toFixed(2),
    };
    await this.redisService.set("general_exchange_rates", JSON.stringify(dto));
  }

  async getExchangeRate() {
    const res = await this.redisService.get("general_exchange_rates");

    if (!res) {
      Log.warn("Exchange rates not found");
      return {
        EUR: 1,
        USD: 1,
      };
    }

    return JSON.parse(res);
  }
}
