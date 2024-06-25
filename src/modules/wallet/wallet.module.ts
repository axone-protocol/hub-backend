import { HttpService } from "@core/lib/http.service";
import { Okp4Service } from "@core/lib/okp4/okp4.service";
import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletService } from "./wallet.service";

@Module({
  imports: [],
  providers: [WalletService, Okp4Service, HttpService],
  controllers: [WalletController],
})
export class WalletModule {}
