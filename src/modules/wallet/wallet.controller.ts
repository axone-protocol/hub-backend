import { Routes } from "@core/enums/routes.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { Controller, Get, Query } from "@nestjs/common";
import { GetBalancesSchema } from "./schemas/get-balances.schema";
import { GetBalancesDto } from "./dtos/get-balances.dto";
import { WalletRoutesEnum } from "./wallet-routes.enum";
import { WalletService } from "./wallet.service";
import { GetWalletRewardsHistoryDto } from "./dtos/get-wallet-rewards-history.dto";
import { GetWalletRewardsHistorySchema } from "./schemas/get-wallet-rewards-history.schema";

@Controller(Routes.WALLET)
export class WalletController {
  constructor(private readonly service: WalletService) {}

  @Get(WalletRoutesEnum.BALANCES)
  async getBalances(
    @Query(new SchemaValidatePipe(GetBalancesSchema))
      dto: GetBalancesDto
  ) {
    return this.service.getBalances(dto);
  }

  @Get(WalletRoutesEnum.REWARD_HISTORY)
  async getWalletRewardsHistory(
    @Query(new SchemaValidatePipe(GetWalletRewardsHistorySchema))
      dto: GetWalletRewardsHistoryDto
  ) {
    return this.service.getWalletRewardsHistory(dto);
  }
}
