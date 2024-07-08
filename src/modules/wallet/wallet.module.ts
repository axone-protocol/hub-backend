import { HttpService } from "@core/lib/http.service";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";
import { WalletCache } from "./wallet-cache";
import { RedisService } from "@core/lib/redis.service";

@Module({
  imports: [],
  providers: [WalletService, Okp4Service, HttpService, WalletCache, RedisService],
  controllers: [WalletController],
})
export class WalletModule {}
