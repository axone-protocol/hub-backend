import { ExchangeRateService } from "@core/lib/exchange-rate.service";
import { HttpService } from "@core/lib/http.service";
import { Module } from "@nestjs/common";
import { GeneralController } from "./general.controller";
import { GeneralService } from "./generl.service";
import { RedisService } from "@core/lib/redis.service";

@Module({
  providers: [ExchangeRateService, HttpService, GeneralService, RedisService],
  controllers: [GeneralController],
})
export class GeneralModule {}
