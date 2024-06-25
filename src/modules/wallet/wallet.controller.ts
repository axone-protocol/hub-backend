import { Routes } from "@core/enums/routes.enum";
import { SchemaValidatePipe } from "@core/pipes/schema-validate.pipe";
import { Controller, Get, Query } from "@nestjs/common";
import { GetBalancesSchema } from "./get-balances.schema";
import { GetBalancesDto } from "./get-balances.dto";
import { WalletRoutesEnum } from "./wallet-routes.enum";
import { WalletService } from "./wallet.service";

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
}
